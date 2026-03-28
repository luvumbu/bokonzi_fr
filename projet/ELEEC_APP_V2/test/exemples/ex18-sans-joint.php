<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Exemple 18 - Sans joint</title>
    <link rel="stylesheet" href="../../css/style.css">
</head>
<body>
    <div id="titre" style="position:fixed;top:10px;left:10px;background:rgba(0,0,0,0.7);color:#fff;padding:10px;border-radius:6px;font-family:monospace;font-size:14px;z-index:10;">Exemple 18 — Sans joint</div>
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

    var mur = new Brique(sceneManager.scene);
    mur.setCouleurJoint(null);
    mur.construire(0, 0, 0, 5, 2.50, 0);

    </script>
</body>
</html>
