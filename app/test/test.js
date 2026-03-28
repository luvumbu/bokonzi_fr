// ===== TESTS ELEEC APP =====
// Charger dans la console du navigateur ou via <script src="test/test.js">
const Test = {
    results: [],
    passed: 0,
    failed: 0,

    assert(name, condition, detail) {
        if (condition) {
            this.passed++;
            this.results.push({ name, status: 'PASS' });
        } else {
            this.failed++;
            this.results.push({ name, status: 'FAIL', detail });
            console.error(`FAIL: ${name}`, detail || '');
        }
    },

    // Charger les données de test JSON dans l'app
    async loadTestData() {
        const resp = await fetch('test/test-data.json');
        const data = await resp.json();

        // Injecter projet
        projet.nom = data.projet.nom;
        projet.type = data.projet.type;
        projet.etages = data.projet.etages;

        // Injecter floors, walls, doors, equips
        Grid.floors = {};
        Grid.walls = {};
        Grid.doors = {};
        Grid.equips = {};
        for (const fi in data.floors) Grid.floors[parseInt(fi)] = data.floors[fi];
        for (const fi in data.walls) Grid.walls[parseInt(fi)] = data.walls[fi];
        for (const fi in data.doors) Grid.doors[parseInt(fi)] = data.doors[fi];
        for (const fi in data.equips) Grid.equips[parseInt(fi)] = data.equips[fi];

        // Injecter appareils
        projet.appareils = data.appareils || {};

        console.log('Test data loaded:', data.projet.nom);
        return data;
    },

    // ===== TESTS UNITAIRES =====

    testDataModel() {
        console.group('Data Model');

        this.assert('projet.nom défini', projet.nom === 'Maison Test');
        this.assert('projet.type défini', projet.type === 'maison');
        this.assert('3 étages', projet.etages.length === 3);

        // Floors
        this.assert('Floor 0 existe', !!Grid.floors[0]);
        this.assert('Floor 1 existe', !!Grid.floors[1]);
        this.assert('Floor 2 existe', !!Grid.floors[2]);

        // Rooms count
        const f0keys = Object.keys(Grid.floors[0] || {});
        const f1keys = Object.keys(Grid.floors[1] || {});
        const f2keys = Object.keys(Grid.floors[2] || {});
        this.assert('Floor 0: 2 pièces', f0keys.length === 2, `got ${f0keys.length}: ${f0keys}`);
        this.assert('Floor 1: 5 pièces', f1keys.length === 5, `got ${f1keys.length}: ${f1keys}`);
        this.assert('Floor 2: 4 pièces', f2keys.length === 4, `got ${f2keys.length}: ${f2keys}`);

        // Room types
        this.assert('Floor 0 a cave', !!Grid.floors[0]['cave_0']);
        this.assert('Floor 0 a garage', !!Grid.floors[0]['garage_0']);
        this.assert('Floor 1 a salon', !!Grid.floors[1]['salon_0']);
        this.assert('Floor 1 a cuisine', !!Grid.floors[1]['cuisine_0']);

        // Cells count
        this.assert('Salon = 15 cells', Grid.floors[1]['salon_0'].cells.length === 15);
        this.assert('Cave = 9 cells', Grid.floors[0]['cave_0'].cells.length === 9);

        console.groupEnd();
    },

    testWalls() {
        console.group('Walls & Doors');

        const w0 = Object.keys(Grid.walls[0] || {});
        const w1 = Object.keys(Grid.walls[1] || {});
        const w2 = Object.keys(Grid.walls[2] || {});
        this.assert('Floor 0 a des murs', w0.length > 0, `${w0.length} murs`);
        this.assert('Floor 1 a des murs', w1.length > 0, `${w1.length} murs`);
        this.assert('Floor 2 a des murs', w2.length > 0, `${w2.length} murs`);

        // Doors
        const d1 = Object.keys(Grid.doors[1] || {});
        const d2 = Object.keys(Grid.doors[2] || {});
        this.assert('Floor 1 a des portes', d1.length > 0, `${d1.length} portes`);
        this.assert('Floor 2 a des portes', d2.length > 0, `${d2.length} portes`);

        // Portes sont aussi des murs
        for (const dk of d1) {
            this.assert(`Porte ${dk} est aussi un mur (f1)`, !!Grid.walls[1][dk]);
        }

        // Wall orientation keys
        const allWalls = [...w0, ...w1, ...w2];
        const hWalls = allWalls.filter(k => k.startsWith('h_'));
        const vWalls = allWalls.filter(k => k.startsWith('v_'));
        this.assert('Murs horizontaux existent', hWalls.length > 0);
        this.assert('Murs verticaux existent', vWalls.length > 0);

        console.groupEnd();
    },

    testEquips() {
        console.group('Équipements');

        const e1 = Grid.equips[1] || {};
        const e2 = Grid.equips[2] || {};
        this.assert('Floor 1 a des équipements', Object.keys(e1).length > 0);
        this.assert('Floor 2 a des équipements', Object.keys(e2).length > 0);

        // Types
        this.assert('Prise au salon (2_2)', e1['2_2'] && e1['2_2'][0].type === 'prise');
        this.assert('Double prise cuisine (1_8)', e1['1_8'] && e1['1_8'][0].type === 'double');
        this.assert('Interrupteur (3_1)', e1['3_1'] && e1['3_1'][0].type === 'interrupteur');

        // Multi-equip sur une cellule
        this.assert('Bureau cellule 5_2 a 2 equips', e2['5_2'] && e2['5_2'].length === 2);

        console.groupEnd();
    },

    testWallOrient() {
        console.group('Wall Orientation');

        // Test wallOrient default
        this.assert('wallOrient par défaut = h', Grid.wallOrient === 'h');

        // Test setWallOrient
        Grid.setWallOrient('v', null);
        this.assert('setWallOrient(v) change wallOrient', Grid.wallOrient === 'v');
        Grid.setWallOrient('d', null);
        this.assert('setWallOrient(d) change wallOrient', Grid.wallOrient === 'd');
        Grid.setWallOrient('h', null);
        this.assert('setWallOrient(h) reset', Grid.wallOrient === 'h');

        console.groupEnd();
    },

    testSelectEquip() {
        console.group('Select Equip → Orientation Visible');

        // Simuler clic sur "Mur"
        const wallBtn = document.querySelector('[data-equip="wall"]');
        const orientEl = document.getElementById('wall-orient');

        if (wallBtn && orientEl) {
            Grid.selectEquip(wallBtn);
            this.assert('Après selectEquip(wall): currentEquip = wall', Grid.currentEquip === 'wall');
            this.assert('Après selectEquip(wall): currentType = null', Grid.currentType === null);
            this.assert('Orientation visible', orientEl.style.display !== 'none');
            this.assert('wallOrient reset à h', Grid.wallOrient === 'h');

            // Vérifier bouton actif
            const activeBtn = orientEl.querySelector('.orient-btn.active');
            this.assert('Bouton H est actif', activeBtn && activeBtn.dataset.orient === 'h');

            // Simuler clic sur "Porte"
            const doorBtn = document.querySelector('[data-equip="door"]');
            if (doorBtn) {
                Grid.selectEquip(doorBtn);
                this.assert('Après selectEquip(door): orientation visible', orientEl.style.display !== 'none');
                this.assert('Après selectEquip(door): wallOrient = h', Grid.wallOrient === 'h');
            }

            // Simuler clic sur "Suppr. mur"
            const eraseBtn = document.querySelector('[data-equip="erase-wall"]');
            if (eraseBtn) {
                Grid.selectEquip(eraseBtn);
                this.assert('Après selectEquip(erase-wall): orientation cachée', orientEl.style.display === 'none');
            }

            // Simuler clic sur prise (non-struct)
            const priseBtn = document.querySelector('[data-equip="prise"]');
            if (priseBtn) {
                Grid.selectEquip(priseBtn);
                this.assert('Après selectEquip(prise): orientation cachée', orientEl.style.display === 'none');
            }
        } else {
            this.assert('Bouton Mur trouvé dans le DOM', false, 'wallBtn ou orientEl manquant');
        }

        console.groupEnd();
    },

    testEdgeOverlay() {
        console.group('Edge Overlay');

        // Sélectionner mur
        const wallBtn = document.querySelector('[data-equip="wall"]');
        if (wallBtn) Grid.selectEquip(wallBtn);

        const edgeContainer = document.getElementById('grid-edges');

        // Test orientation H
        Grid.setWallOrient('h', null);
        Grid.showEdgeOverlay();
        const hEdges = edgeContainer.querySelectorAll('.edge-h');
        const vEdges = edgeContainer.querySelectorAll('.edge-v');
        const dEdges = edgeContainer.querySelectorAll('.edge-d');
        this.assert('Orient H: edges horizontaux présents', hEdges.length > 0, `${hEdges.length}`);
        // En mode H, pas d'edges V cliquables (mais existants en grisé possible)
        const clickableV = edgeContainer.querySelectorAll('.edge-v[data-key]');
        this.assert('Orient H: pas d\'edges V cliquables', clickableV.length === 0);

        // Test orientation V
        Grid.setWallOrient('v', null);
        Grid.showEdgeOverlay();
        const vEdges2 = edgeContainer.querySelectorAll('.edge-v[data-key]');
        this.assert('Orient V: edges verticaux présents', vEdges2.length > 0, `${vEdges2.length}`);

        // Test orientation D
        Grid.setWallOrient('d', null);
        Grid.showEdgeOverlay();
        const dEdges2 = edgeContainer.querySelectorAll('.edge-d[data-key]');
        this.assert('Orient D: edges diagonaux présents', dEdges2.length > 0, `${dEdges2.length}`);

        // Reset
        Grid.setWallOrient('h', null);

        console.groupEnd();
    },

    testGridFunctions() {
        console.group('Grid Functions');

        // isAdjacentTo
        this.assert('isAdjacentTo(1,1, ["1_2"])', Grid.isAdjacentTo(1, 1, ['1_2']));
        this.assert('isAdjacentTo(1,1, ["0_1"])', Grid.isAdjacentTo(1, 1, ['0_1']));
        this.assert('!isAdjacentTo(1,1, ["3_3"])', !Grid.isAdjacentTo(1, 1, ['3_3']));

        // countRoomEquips
        Grid.currentFloor = 1;
        const eqs = Grid.countRoomEquips('salon_0');
        this.assert('Salon a des equips', Object.keys(eqs).length > 0);

        // getAllEquipsForFloor
        const allEq1 = Grid.getAllEquipsForFloor(1);
        this.assert('getAllEquipsForFloor(1) retourne des equips', allEq1.length > 0, `${allEq1.length}`);

        console.groupEnd();
    },

    // ===== TEST VISUEL : charger données et afficher =====
    async testVisual() {
        console.group('Visual Test');

        // Aller à l'étape 4
        App.goStep(4);

        // Init floor 1 (RDC)
        Grid.init(1);
        this.assert('Grid initialisée sur floor 1', Grid.currentFloor === 1);

        // Vérifier que les cellules sont affichées
        const occupied = document.querySelectorAll('.grid-cell.occupied');
        this.assert('Cellules occupées visibles', occupied.length > 0, `${occupied.length} cellules`);

        // Vérifier rooms list
        const roomsList = document.getElementById('rooms-list');
        this.assert('Rooms list rempli', roomsList && roomsList.innerHTML.length > 0);

        console.groupEnd();
    },

    // ===== RÉSUMÉ =====
    summary() {
        console.log('\n========================================');
        console.log(`RÉSULTATS: ${this.passed} PASS / ${this.failed} FAIL / ${this.passed + this.failed} TOTAL`);
        console.log('========================================');
        if (this.failed > 0) {
            console.log('Échecs:');
            this.results.filter(r => r.status === 'FAIL').forEach(r => {
                console.log(`  ✗ ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
            });
        }
        if (this.failed === 0) {
            console.log('✓ Tous les tests passent !');
        }
        return { passed: this.passed, failed: this.failed, results: this.results };
    },

    // ===== RUN ALL =====
    async runAll() {
        this.results = [];
        this.passed = 0;
        this.failed = 0;

        console.log('===== ELEEC APP — Tests =====');

        await this.loadTestData();

        this.testDataModel();
        this.testWalls();
        this.testEquips();
        this.testWallOrient();
        this.testSelectEquip();
        this.testEdgeOverlay();
        this.testGridFunctions();
        await this.testVisual();

        return this.summary();
    }
};

// Auto-run si chargé via <script>
if (document.readyState === 'complete') {
    Test.runAll();
} else {
    window.addEventListener('load', () => Test.runAll());
}
