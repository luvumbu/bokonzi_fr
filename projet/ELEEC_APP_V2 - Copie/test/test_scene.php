<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Scene - ELEEC APP V2</title>
    <link rel="stylesheet" href="../css/style.css">
    <style>
        #panneau {
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: #fff;
            padding: 15px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 14px;
            z-index: 10;
        }
        #panneau label {
            display: block;
            margin: 8px 0 4px;
        }
        #panneau input[type="number"],
        #panneau input[type="color"] {
            width: 80px;
            padding: 4px;
            background: #333;
            color: #fff;
            border: 1px solid #666;
            border-radius: 4px;
        }
        #panneau button {
            margin-top: 12px;
            padding: 8px 16px;
            background: #e94560;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        #panneau button:hover {
            background: #ff6b81;
        }
    </style>
</head>
<body>

    <div id="panneau">
        <strong>Test Scene</strong>

        <label>Couleur ciel
            <input type="color" id="val-ciel" value="#FFFF00">
        </label>

        <label>Couleur sol
            <input type="color" id="val-sol" value="#555555">
        </label>

        <label>Lumiere ambiante
            <input type="number" id="val-ambiant" value="0.4" step="0.1" min="0" max="2">
        </label>

        <label>Lumiere soleil
            <input type="number" id="val-soleil" value="0.8" step="0.1" min="0" max="2">
        </label>

        <label>Soleil X
            <input type="number" id="val-soleil-x" value="10" step="1">
        </label>
        <label>Soleil Y
            <input type="number" id="val-soleil-y" value="15" step="1">
        </label>
        <label>Soleil Z
            <input type="number" id="val-soleil-z" value="10" step="1">
        </label>

        <label>Camera X
            <input type="number" id="val-cam-x" value="8" step="1">
        </label>
        <label>Camera Y
            <input type="number" id="val-cam-y" value="6" step="1">
        </label>
        <label>Camera Z
            <input type="number" id="val-cam-z" value="12" step="1">
        </label>

        <label>
            <input type="checkbox" id="val-grille" checked> Grille
        </label>

        <button id="btn-appliquer">Appliquer</button>
    </div>

    <div id="canvas-container"></div>

    <!-- Three.js -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>

    <!-- Scene -->
    <script src="../js/scene/SceneManager.js"></script>

    <!-- Test JS -->
    <?php include 'test_scene_js.php'; ?>

</body>
</html>
