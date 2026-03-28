<script>
// ========================================
// Test Scene — teste les methodes de SceneManager + Sun
// ========================================

// --- Ciel : degrade bleu fonce en haut, bleu clair en bas ---
sceneManager.setCielDegrade('#0044AA', '#87CEEB');

// --- Camera : position de depart (x, y, z) ---
sceneManager.setCamera(10, 5, 2);

// --- Cible : point que la camera regarde (x, y, z) ---
sceneManager.setCible(0, 0, 0);

// --- Plateau : 20x10 cases de 0.5m = 10m x 5m ---
sceneManager.setPlateau(50, 50, 0.5);

// --- Soleil : position, intensite ---
sceneManager.setPositionSoleil(20, 25, -15);

// --- Acces direct a la classe Sun pour reglages fins ---
// sceneManager.sun.setCouleur('#FFAA00');   // coucher de soleil
// sceneManager.sun.setTaille(0.3);          // sphere plus grosse
// sceneManager.sun.setHalo(0.15);           // halo plus visible
// sceneManager.sun.setVisible(false);       // cacher la sphere

</script>
