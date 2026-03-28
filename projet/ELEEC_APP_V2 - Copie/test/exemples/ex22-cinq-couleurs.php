<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Exemple 22 - Mur 5 couleurs</title>
    <link rel="stylesheet" href="../../css/style.css">
</head>
<body>
    <div id="titre" style="position:fixed;top:10px;left:10px;background:rgba(0,0,0,0.7);color:#fff;padding:10px;border-radius:6px;font-family:monospace;font-size:14px;z-index:10;">Exemple 22 — Mur 5 couleurs</div>
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
    sceneManager.setCamera(10, 5, 8);
    sceneManager.setCible(2.5, 1, 2.5);

    // --- Couleur 1 : briques 1, 6, 11, 16... ---
    var mur_1 = new Brique(sceneManager.scene);
    mur_1.setCouleur('#8b6132');
    mur_1.setCouleurJoint('#000000');
    mur_1.setIgnorer(5, 1);
    mur_1.setPriorite(1);
    mur_1.construire(0, 0, 0, 5, 2.50, 0);

    // --- Couleur 2 : briques 2, 7, 12, 17... ---
    var mur_2 = new Brique(sceneManager.scene);
    mur_2.setCouleur('#CC6633');
    mur_2.setCouleurJoint(null);
    mur_2.setIgnorer(5, 2);
    mur_2.setPriorite(2);
    mur_2.construire(0, 0, 0, 5, 2.50, 0);

    // --- Couleur 3 : briques 3, 8, 13, 18... ---
    var mur_3 = new Brique(sceneManager.scene);
    mur_3.setCouleur('#F5DEB3');
    mur_3.setCouleurJoint(null);
    mur_3.setIgnorer(5, 3);
    mur_3.setPriorite(3);
    mur_3.construire(0, 0, 0, 5, 2.50, 0);

    // --- Couleur 4 : briques 4, 9, 14, 19... ---
    var mur_4 = new Brique(sceneManager.scene);
    mur_4.setCouleur('#555555');
    mur_4.setCouleurJoint(null);
    mur_4.setIgnorer(5, 4);
    mur_4.setPriorite(4);
    mur_4.construire(0, 0, 0, 5, 2.50, 0);

    // --- Couleur 5 : briques 5, 10, 15, 20... ---
    var mur_5 = new Brique(sceneManager.scene);
    mur_5.setCouleur('#2E8B57');
    mur_5.setCouleurJoint(null);
    mur_5.setIgnorer(5, 5);
    mur_5.setPriorite(5);
    mur_5.construire(0, 0, 0, 5, 2.50, 0);

    </script>
</body>
</html>
