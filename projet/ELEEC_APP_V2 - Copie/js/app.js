// ELEEC APP V2 - Application principale

var container = document.getElementById('canvas-container');
var sceneManager = new SceneManager(container);
sceneManager.setCielDegrade('#0044AA', '#87CEEB');
sceneManager.setCamera(12, 8, 12);
sceneManager.setCible(3, 1, 3);
sceneManager.setPlateau(40, 40);

// murBase supprime — le mur initial est cree par l'editeur
