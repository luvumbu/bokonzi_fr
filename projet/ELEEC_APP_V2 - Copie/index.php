<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ELEEC APP V2</title>
    <link rel="icon" type="image/svg+xml" href="favicon.svg">
    <link rel="stylesheet" href="css/style.css">
</head>
<body>

    <!-- Menu editeur (HTML + CSS) -->
    <?php require_once 'ui/menu-editeur.php'; ?>

    <div id="canvas-container"></div>

    <!-- Three.js -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>

    <!-- Scene 3D -->
    <script src="js/scene/Sun.js"></script>
    <script src="js/scene/Axes.js"></script>
    <script src="js/scene/SceneManager.js"></script>

    <!-- Engine -->
    <script src="js/engine/Brique.js"></script>

    <!-- Editeur -->
    <script src="js/ui/Editeur.js"></script>
    <script src="js/ui/Fenetre.js"></script>
    <script src="js/ui/Porte.js"></script>
    <script src="js/ui/Personnage.js"></script>
    <script src="js/ui/Placo.js"></script>
    <script src="js/ui/LaineDeVerre.js"></script>
    <script src="js/ui/Plinthe.js"></script>
    <script src="js/ui/Carrelage.js"></script>
    <script src="js/ui/PapierPeint.js"></script>
    <script src="js/ui/Escalier.js"></script>

    <!-- Application -->
    <script src="js/app.js"></script>

    <!-- Logique du menu -->
    <script src="js/ui/menu-editeur.js"></script>

    <!-- Tests -->
    <script src="js/test/TestAPI.js"></script>

</body>
</html>
