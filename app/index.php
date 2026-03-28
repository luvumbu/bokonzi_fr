<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ELEEC — Installation Électrique</title>
    <link rel="stylesheet" href="css/style.css?v=<?= time() ?>">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
</head>
<body>

<div id="app">
    <!-- ÉTAPE 1 : Nom du projet -->
    <div class="step active" data-step="1">
        <div class="step-card">
            <div class="step-number">1</div>
            <h1>Nouveau Projet</h1>
            <p>Comment voulez-vous appeler ce projet ?</p>
            <input type="text" id="projet-nom" placeholder="Ex: Maison de Paul, Appart Lyon..." autofocus>
            <button class="btn-next" onclick="App.goStep(2)">Suivant →</button>
        </div>
    </div>

    <!-- ÉTAPE 2 : Type de logement -->
    <div class="step" data-step="2">
        <div class="step-card">
            <div class="step-number">2</div>
            <h1 id="titre-step2">Type de logement</h1>
            <p>Quel type de logement ?</p>
            <div class="type-choice">
                <div class="type-card" onclick="App.setType('maison')">
                    <div class="type-icon">🏠</div>
                    <span>Maison</span>
                </div>
                <div class="type-card" onclick="App.setType('appartement')">
                    <div class="type-icon">🏢</div>
                    <span>Appartement</span>
                </div>
            </div>
            <button class="btn-back" onclick="App.goStep(1)">← Retour</button>
        </div>
    </div>

    <!-- ÉTAPE 3 : Config étages (maison) ou pièces (appart) -->
    <div class="step" data-step="3">
        <div class="step-card">
            <div class="step-number">3</div>
            <h1 id="titre-step3">Configuration</h1>
            <div id="config-maison" style="display:none">
                <p>Combien d'étages ?</p>
                <div class="stepper">
                    <button onclick="App.adjustEtages(-1)">−</button>
                    <span id="nb-etages">1</span>
                    <button onclick="App.adjustEtages(1)">+</button>
                </div>
                <p class="hint">Sous-sol, RDC, étages... tout compte</p>
                <div id="etages-liste"></div>
            </div>
            <div id="config-appart" style="display:none">
                <p>Combien de pièces ?</p>
                <div class="stepper">
                    <button onclick="App.adjustPieces(-1)">−</button>
                    <span id="nb-pieces">3</span>
                    <button onclick="App.adjustPieces(1)">+</button>
                </div>
            </div>
            <div class="step-actions">
                <button class="btn-back" onclick="App.goStep(2)">← Retour</button>
                <button class="btn-next" onclick="App.goStep(4)">Suivant →</button>
            </div>
        </div>
    </div>

    <!-- ÉTAPE 4 : Éditeur de pièces (style Sims) -->
    <div class="step" data-step="4">
        <div class="step-card step-card-wide">
            <div class="step-number">4</div>
            <h1>Plan des pièces</h1>
            <p>Cliquez et glissez sur la grille pour dessiner vos pièces</p>

            <!-- Sélecteur d'étage -->
            <div id="floor-selector"></div>

            <!-- Palette de pièces -->
            <div class="room-palette">
                <div class="palette-item active" data-type="salon" onclick="Grid.selectType(this)">
                    <span class="palette-color" style="background:#4CAF50"></span> Salon
                </div>
                <div class="palette-item" data-type="chambre" onclick="Grid.selectType(this)">
                    <span class="palette-color" style="background:#2196F3"></span> Chambre
                </div>
                <div class="palette-item" data-type="cuisine" onclick="Grid.selectType(this)">
                    <span class="palette-color" style="background:#FF9800"></span> Cuisine
                </div>
                <div class="palette-item" data-type="sdb" onclick="Grid.selectType(this)">
                    <span class="palette-color" style="background:#00BCD4"></span> Salle de bain
                </div>
                <div class="palette-item" data-type="wc" onclick="Grid.selectType(this)">
                    <span class="palette-color" style="background:#9C27B0"></span> WC
                </div>
                <div class="palette-item" data-type="couloir" onclick="Grid.selectType(this)">
                    <span class="palette-color" style="background:#795548"></span> Couloir
                </div>
                <div class="palette-item" data-type="cave" onclick="Grid.selectType(this)">
                    <span class="palette-color" style="background:#607D8B"></span> Cave
                </div>
                <div class="palette-item" data-type="garage" onclick="Grid.selectType(this)">
                    <span class="palette-color" style="background:#455A64"></span> Garage
                </div>
                <div class="palette-item" data-type="bureau" onclick="Grid.selectType(this)">
                    <span class="palette-color" style="background:#E91E63"></span> Bureau
                </div>
                <div class="palette-item palette-eraser" data-type="eraser" onclick="Grid.selectType(this)">
                    ✕ Effacer
                </div>
            </div>

            <!-- Palette structure (murs, portes) -->
            <div class="equip-palette">
                <span class="equip-label">Structure :</span>
                <div class="palette-item palette-struct palette-wall-auto" data-equip="wall-auto" onclick="Grid.selectEquip(this)">
                    ╋ Mur Auto
                </div>
                <div class="palette-item palette-struct palette-wall-h" data-equip="wall-h" onclick="Grid.selectEquip(this)">
                    ━ Mur H
                </div>
                <div class="palette-item palette-struct palette-wall-v" data-equip="wall-v" onclick="Grid.selectEquip(this)">
                    ┃ Mur V
                </div>
                <div class="palette-item palette-struct" data-equip="door" onclick="Grid.selectEquip(this)">
                    🚪 Porte
                </div>
                <div class="palette-item palette-struct" data-equip="window" onclick="Grid.selectEquip(this)">
                    🪟 Fenêtre
                </div>
                <div class="palette-item palette-struct" data-equip="erase-wall" onclick="Grid.selectEquip(this)">
                    ✕ Suppr.
                </div>
            </div>
            <!-- Orientation (visible quand Mur, Porte ou Fenêtre sélectionné) -->
            <div class="wall-orient" id="wall-orient" style="display:none">
                <span class="equip-label">Orientation :</span>
                <button class="orient-btn active" data-orient="h" onclick="Grid.setWallOrient('h', this)">━ Horizontal</button>
                <button class="orient-btn" data-orient="v" onclick="Grid.setWallOrient('v', this)">┃ Vertical</button>
                <button class="orient-btn" data-orient="d" onclick="Grid.setWallOrient('d', this)">╲ Diagonal</button>
            </div>
            <!-- Type de fenêtre (visible quand Fenêtre sélectionné) -->
            <div class="window-type-selector" id="window-type-selector" style="display:none">
                <span class="equip-label">Type de fenêtre :</span>
                <button class="win-type-btn active" data-wtype="simple" onclick="Grid.setWindowType('simple', this)">▫ Simple</button>
                <button class="win-type-btn" data-wtype="double" onclick="Grid.setWindowType('double', this)">▫▫ Double</button>
                <button class="win-type-btn" data-wtype="baie" onclick="Grid.setWindowType('baie', this)">▭ Baie vitrée</button>
                <button class="win-type-btn" data-wtype="velux" onclick="Grid.setWindowType('velux', this)">◇ Velux</button>
                <button class="win-type-btn" data-wtype="oeil" onclick="Grid.setWindowType('oeil', this)">◯ Œil-de-bœuf</button>
            </div>

            <!-- Palette équipements (prises, interrupteurs) -->
            <div class="equip-palette">
                <span class="equip-label">Équipements :</span>
                <div class="palette-item palette-equip" data-equip="prise" onclick="Grid.selectEquip(this)">
                    🔌 Prise
                </div>
                <div class="palette-item palette-equip" data-equip="double" onclick="Grid.selectEquip(this)">
                    🔌🔌 Double prise
                </div>
                <div class="palette-item palette-equip" data-equip="interrupteur" onclick="Grid.selectEquip(this)">
                    🔘 Interrupteur
                </div>
                <div class="palette-item palette-equip" data-equip="erase-equip" onclick="Grid.selectEquip(this)">
                    ✕ Suppr. équipement
                </div>
            </div>

            <!-- Toggle vue -->
            <div class="view-toggle">
                <button class="view-btn active" onclick="Grid.setView('2d', this)">Vue 2D (plan)</button>
                <button class="view-btn" onclick="Grid.setView('coupe', this)">Vue coupe (tous étages)</button>
                <button class="view-btn" onclick="Grid.setView('3d', this)">Vue 3D</button>
            </div>

            <!-- Grille édition (vue 2D) -->
            <div id="grid-container">
                <div id="grid-wrapper">
                    <div id="grid"></div>
                    <div id="grid-edges"></div>
                </div>
            </div>

            <!-- Vue coupe (tous étages empilés) -->
            <div id="coupe-container" style="display:none"></div>

            <!-- Vue 3D -->
            <div id="three-container" style="display:none"></div>

            <!-- Liste des pièces créées -->
            <div id="rooms-list"></div>

            <div class="step-actions">
                <button class="btn-back" onclick="App.goStep(3)">← Retour</button>
                <button class="btn-next" onclick="App.goStep(5)">Appareils →</button>
            </div>
        </div>
    </div>

    <!-- ÉTAPE 5 : Appareils par pièce -->
    <div class="step" data-step="5">
        <div class="step-card step-card-wide">
            <div class="step-number">5</div>
            <h1>Appareils électriques</h1>
            <p>Définissez les appareils dans chaque pièce</p>

            <div id="appareils-container"></div>

            <div class="step-actions">
                <button class="btn-back" onclick="App.goStep(4)">← Retour</button>
                <button class="btn-next" onclick="App.generateReport()">Générer le rapport →</button>
            </div>
        </div>
    </div>

    <!-- ÉTAPE 6 : Rapport final -->
    <div class="step" data-step="6">
        <div class="step-card step-card-wide">
            <div class="step-number">✓</div>
            <h1 id="rapport-titre">Rapport</h1>
            <div id="rapport-content"></div>
            <div class="step-actions">
                <button class="btn-back" onclick="App.goStep(5)">← Modifier</button>
                <button class="btn-next" onclick="App.exportPDF()">Exporter</button>
            </div>
        </div>
    </div>
</div>

<!-- Barre de progression -->
<div id="progress-bar">
    <div class="progress-step done" data-pstep="1">1. Nom</div>
    <div class="progress-step" data-pstep="2">2. Type</div>
    <div class="progress-step" data-pstep="3">3. Config</div>
    <div class="progress-step" data-pstep="4">4. Plan</div>
    <div class="progress-step" data-pstep="5">5. Appareils</div>
    <div class="progress-step" data-pstep="6">6. Rapport</div>
</div>

<script src="js/app.js?v=<?= time() ?>"></script>
<script src="js/grid.js?v=<?= time() ?>"></script>
<script src="js/view3d.js?v=<?= time() ?>"></script>

</body>
</html>
