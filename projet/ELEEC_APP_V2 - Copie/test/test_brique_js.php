<script>
// ========================================
// Test MurAvecTrou — carre avec porte + fenetres
// ========================================

// --- Variables ---
var briqueCouleur_1 = '#8b6132';
var jointCouleur_1 = '#000000';
var murX_1 = 0;
var murY_1 = 0;
var murZ_1 = 0;
var murDistance_1 = 5;
var murHauteur_1 = 2.50;
var murNbCotes_1 = 4;
var murAngleDepart_1 = 0;

// --- Creer ---
var mur_1 = new Brique(sceneManager.scene);
mur_1.setCouleur(briqueCouleur_1);
mur_1.setCouleurJoint(jointCouleur_1);

// --- Trous ---
// ajouterTrou(x, y, largeur, hauteur, alignement, decalage, murIndex)

// Mur 0 (facade) : porte centree + 2 fenetres de chaque cote
mur_1.ajouterTrou(0, 0, 0.90, 2.15, 'center', 0, 0);         // porte
mur_1.ajouterTrou(0, 0.90, 1.00, 1.00, 'start', 0.3, 0);     // fenetre gauche
mur_1.ajouterTrou(0, 0.90, 1.00, 1.00, 'end', -0.3, 0);      // fenetre droite

// Mur 1 (droite) : 1 fenetre centree
mur_1.ajouterTrou(0, 0.90, 1.20, 1.20, 'center', 0, 1);

// Mur 2 (arriere) : 2 fenetres espacees
mur_1.ajouterTrou(0, 0.90, 2.20, 1.20, 'center', -1, 2);     // fenetre gauche
mur_1.ajouterTrou(0, 0.90, 1.20, 1.20, 'center', 1, 2);      // fenetre droite

// Mur 3 (gauche) : pas de trou

// --- Construire ---
mur_1.construireForme(murX_1, murY_1, murZ_1, murDistance_1, murHauteur_1, murNbCotes_1, murAngleDepart_1);

console.log('Total briques : ' + mur_1.compter());

</script>
