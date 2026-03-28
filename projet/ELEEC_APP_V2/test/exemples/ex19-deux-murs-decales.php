<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Exemple 19 - Deux murs decales (ignorer true/false)</title>
    <link rel="stylesheet" href="../../css/style.css">
</head>
<body>
    <div id="titre" style="position:fixed;top:10px;left:10px;background:rgba(0,0,0,0.7);color:#fff;padding:10px;border-radius:6px;font-family:monospace;font-size:14px;z-index:10;">Exemple 19 — Deux murs decales (ignorer true/false)</div>
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

    // --- Mur 1 : commencerVide = false (plein, vide, plein, vide...) ---
    var mur_1 = new Brique(sceneManager.scene);
    mur_1.setCouleur('#8b6132');
    mur_1.setCouleurJoint('#000000');
    mur_1.setIgnorer(2, false);
    mur_1.setPriorite(1);
    mur_1.construire(0, 0, 0, 5, 2.50, 0);

    // --- Mur 2 : commencerVide = true (vide, plein, vide, plein...) ---
    var mur_2 = new Brique(sceneManager.scene);
    mur_2.setCouleur('#CC6633');
    mur_2.setCouleurJoint('#000000');
    mur_2.setIgnorer(2, true);
    mur_2.setPriorite(2);
    mur_2.construire(0, 0, 0, 5, 2.50, 0);

    </script>
</body>
</html>
