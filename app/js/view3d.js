// ===== VUE 3D (Three.js) =====
const View3D = {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    animId: null,
    floorGroups: [],   // THREE.Group par étage
    activeFloor: -1,   // -1 = tous visibles
    editFloor: 0,      // étage en cours d'édition

    FLOOR_HEIGHT: 1.2,
    CELL_SIZE: 0.5,
    WALL_HEIGHT: 1.0,

    // === Drawing state ===
    drawMode: false,       // mode édition activé
    drawType: 'salon',     // type de pièce à dessiner
    raycaster: null,
    mouse: new THREE.Vector2(),
    floorPlane: null,      // plan transparent pour le raycasting
    isDrawing3D: false,
    startCell3D: null,
    previewMeshes: [],     // meshes de preview pendant le drag
    hoverMesh: null,       // mesh de survol
    gridHelperFloor: null, // grille d'aide visible en mode édition
    pendingEdge3D: null,   // { edgeKey, meshes[] } — mur/porte en attente de confirmation
    edgeHoverMesh: null,   // mesh preview mur/porte au survol

    init() {
        const container = document.getElementById('three-container');
        const w = container.clientWidth;
        const h = container.clientHeight;

        this.dispose();
        this.floorGroups = [];
        this.activeFloor = -1;
        this.editFloor = 0;
        this.drawMode = false;
        this.previewMeshes = [];

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a16);
        this.scene.fog = new THREE.Fog(0x0a0a16, 30, 60);

        // Camera
        this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(w, h);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        container.innerHTML = '';
        container.appendChild(this.renderer.domElement);

        // Raycaster
        this.raycaster = new THREE.Raycaster();

        // Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 40;

        // Lights
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(8, 15, 8);
        dirLight.castShadow = true;
        this.scene.add(dirLight);
        this.scene.add(new THREE.HemisphereLight(0x8888ff, 0x444422, 0.3));

        // Ground
        this.addGround();

        // Build
        this.buildModel();

        // UI overlay
        this.buildOverlay(container);

        // Pointer events for 3D drawing (same type as OrbitControls r128)
        this._onPointerDown3D = (e) => this.onMouseDown3D(e);
        this._onPointerMove3D = (e) => this.onMouseMove3D(e);
        this._onPointerUp3D = (e) => this.onMouseUp3D(e);
        this.renderer.domElement.addEventListener('pointerdown', this._onPointerDown3D);
        this.renderer.domElement.addEventListener('pointermove', this._onPointerMove3D);
        this.renderer.domElement.addEventListener('pointerup', this._onPointerUp3D);

        // Center camera
        this.focusAll();

        // Animate
        this.animate();

        // Resize
        this._onResize = () => {
            const w2 = container.clientWidth;
            const h2 = container.clientHeight;
            this.camera.aspect = w2 / h2;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w2, h2);
        };
        window.addEventListener('resize', this._onResize);
    },

    dispose() {
        if (this.animId) cancelAnimationFrame(this.animId);
        if (this.renderer) {
            this.renderer.domElement.removeEventListener('pointerdown', this._onPointerDown3D);
            this.renderer.domElement.removeEventListener('pointermove', this._onPointerMove3D);
            this.renderer.domElement.removeEventListener('pointerup', this._onPointerUp3D);
            this.renderer.dispose();
            this.renderer.domElement.remove();
        }
        if (this._onResize) window.removeEventListener('resize', this._onResize);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.floorGroups = [];
        this.previewMeshes = [];
        this.pendingEdge3D = null;
        this.edgeHoverMesh = null;
    },

    animate() {
        this.animId = requestAnimationFrame(() => this.animate());
        if (this.controls) this.controls.update();
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    },

    // ===== OVERLAY UI =====
    buildOverlay(container) {
        const etages = projet.etages || [{ nom: 'RDC', numero: 0 }];

        let html = '<div class="three-hint" id="three-hint">Souris : tourner / molette : zoom</div>';

        // Floor selector
        html += '<div class="three-floor-panel">';
        html += `<button class="three-floor-btn active" onclick="View3D.showFloor(-1, this)">Tous</button>`;
        etages.forEach((et, i) => {
            html += `<button class="three-floor-btn" onclick="View3D.showFloor(${i}, this)">${et.nom}</button>`;
        });
        html += '<hr style="border-color:#2a2a4a;margin:6px 0">';
        html += `<button class="three-draw-btn" id="btn-draw3d" onclick="View3D.toggleDrawMode()">Dessiner en 3D</button>`;
        html += '</div>';

        // Draw toolbar (barre horizontale en bas de la vue 3D)
        html += '<div class="three-draw-toolbar-bottom" id="draw3d-toolbar" style="display:none">';
        html += '<div class="three-draw-floor" id="draw3d-floor-select"></div>';
        html += '<div class="three-draw-palette" id="draw3d-palette"></div>';
        html += '</div>';

        container.insertAdjacentHTML('beforeend', html);
    },

    // ===== DRAW MODE =====
    toggleDrawMode() {
        this.drawMode = !this.drawMode;
        const btn = document.getElementById('btn-draw3d');
        const toolbar = document.getElementById('draw3d-toolbar');
        const hint = document.getElementById('three-hint');

        if (this.drawMode) {
            btn.classList.add('active');
            toolbar.style.display = '';
            hint.textContent = 'Clic gauche : dessiner / Clic droit : tourner la caméra';

            // Disable left-click orbit: rotate only on right-click
            this.controls.enableRotate = true;
            this.controls.enablePan = false;
            this.controls.mouseButtons = {
                MIDDLE: THREE.MOUSE.DOLLY,
                RIGHT: THREE.MOUSE.ROTATE
            };

            this.buildDrawPalette();
            this.buildDrawFloorSelect();

            // Show floor grid helper
            this.showEditGrid();

            // Auto-select first floor if "tous" is active
            if (this.activeFloor === -1 && projet.etages.length > 0) {
                this.showFloor(0, document.querySelectorAll('.three-floor-btn')[1]);
            }
        } else {
            btn.classList.remove('active');
            toolbar.style.display = 'none';
            hint.textContent = 'Souris : tourner / molette : zoom';

            // Restore orbit controls
            this.controls.enablePan = true;
            this.controls.mouseButtons = {
                LEFT: THREE.MOUSE.ROTATE,
                MIDDLE: THREE.MOUSE.DOLLY,
                RIGHT: THREE.MOUSE.PAN
            };

            this.removeEditGrid();

            // Clean hover + pending
            if (this.hoverMesh) {
                this.scene.remove(this.hoverMesh);
                this.hoverMesh = null;
            }
            this.clearPending3D();
            if (this.edgeHoverMesh) {
                this.edgeHoverMesh.forEach(m => { this.scene.remove(m); m.geometry.dispose(); m.material.dispose(); });
                this.edgeHoverMesh = null;
            }
            if (this.renderer) {
                this.renderer.domElement.style.cursor = 'default';
            }
        }
    },

    buildDrawPalette() {
        const container = document.getElementById('draw3d-palette');
        const types = Object.keys(Grid.ROOM_COLORS);
        let html = '';
        types.forEach((type, i) => {
            const active = i === 0 ? ' active' : '';
            html += `<button class="three-palette-btn${active}" data-type="${type}" onclick="View3D.selectDrawType(this)" style="border-left: 3px solid ${Grid.ROOM_COLORS[type]}">
                ${Grid.ROOM_NAMES[type]}
            </button>`;
        });
        html += `<button class="three-palette-btn three-palette-eraser" data-type="eraser" onclick="View3D.selectDrawType(this)">✕ Effacer pièce</button>`;

        // Structure (murs, portes)
        html += '<div style="border-top:1px solid #2a2a4a;margin-top:6px;padding-top:6px">';
        html += `<button class="three-palette-btn" data-type="wall-auto" onclick="View3D.selectDrawType(this)" style="border-left:3px solid #aaa;color:#aaa">╋ Mur Auto</button>`;
        html += `<button class="three-palette-btn" data-type="wall-h" onclick="View3D.selectDrawType(this)" style="border-left:3px solid #42a5f5;color:#42a5f5">━ Mur H</button>`;
        html += `<button class="three-palette-btn" data-type="wall-v" onclick="View3D.selectDrawType(this)" style="border-left:3px solid #ef5350;color:#ef5350">┃ Mur V</button>`;
        html += `<button class="three-palette-btn" data-type="door" onclick="View3D.selectDrawType(this)" style="border-left:3px solid #8B4513">🚪 Porte</button>`;
        html += `<button class="three-palette-btn" data-type="window" data-wtype="simple" onclick="View3D.selectDrawType(this); View3D.toggleWinTypes()" style="border-left:3px solid #42a5f5">🪟 Fenêtre</button>`;
        html += `<div class="three-win-types" id="three-win-types" style="display:none">`;
        html += `<button class="three-palette-btn win-sub active" data-wtype="simple" onclick="View3D.setWinType3D(this)" style="border-left:3px solid #42a5f5">▫ Simple</button>`;
        html += `<button class="three-palette-btn win-sub" data-wtype="double" onclick="View3D.setWinType3D(this)" style="border-left:3px solid #42a5f5">▫▫ Double</button>`;
        html += `<button class="three-palette-btn win-sub" data-wtype="baie" onclick="View3D.setWinType3D(this)" style="border-left:3px solid #1565c0">▭ Baie</button>`;
        html += `<button class="three-palette-btn win-sub" data-wtype="velux" onclick="View3D.setWinType3D(this)" style="border-left:3px solid #64b5f6">◇ Velux</button>`;
        html += `<button class="three-palette-btn win-sub" data-wtype="oeil" onclick="View3D.setWinType3D(this)" style="border-left:3px solid #90caf9">◯ Œil</button>`;
        html += `</div>`;
        html += `<button class="three-palette-btn three-palette-eraser" data-type="erase-wall" onclick="View3D.selectDrawType(this)">✕ Suppr.</button>`;
        html += '</div>';

        // Equip section
        html += '<div style="border-top:1px solid #2a2a4a;margin-top:6px;padding-top:6px">';
        html += `<button class="three-palette-btn" data-type="equip-prise" onclick="View3D.selectDrawType(this)" style="border-left:3px solid #ffcc00">🔌 Prise</button>`;
        html += `<button class="three-palette-btn" data-type="equip-double" onclick="View3D.selectDrawType(this)" style="border-left:3px solid #ff9900">🔌🔌 Dbl prise</button>`;
        html += `<button class="three-palette-btn" data-type="equip-interrupteur" onclick="View3D.selectDrawType(this)" style="border-left:3px solid #00ff88">🔘 Interr.</button>`;
        html += `<button class="three-palette-btn three-palette-eraser" data-type="equip-erase" onclick="View3D.selectDrawType(this)">✕ Suppr. équip.</button>`;
        html += '</div>';

        container.innerHTML = html;
        this.drawType = types[0]; // default
    },

    buildDrawFloorSelect() {
        const container = document.getElementById('draw3d-floor-select');
        const etages = projet.etages || [{ nom: 'RDC', numero: 0 }];
        let html = '<span style="font-size:11px;color:#888">Étage :</span> ';
        etages.forEach((et, i) => {
            const active = i === this.editFloor ? ' active' : '';
            html += `<button class="three-edit-floor-btn${active}" onclick="View3D.setEditFloor(${i}, this)">${et.nom}</button>`;
        });
        container.innerHTML = html;
    },

    selectDrawType(btn) {
        document.querySelectorAll('.three-palette-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const type = btn.dataset.type;
        // Mur Auto / H / V : raccourcis directs
        if (type === 'wall-auto') {
            this.drawType = 'wall';
            Grid.wallOrient = 'auto';
        } else if (type === 'wall-h') {
            this.drawType = 'wall';
            Grid.wallOrient = 'h';
        } else if (type === 'wall-v') {
            this.drawType = 'wall';
            Grid.wallOrient = 'v';
        } else {
            this.drawType = type;
        }
        // Si c'est une fenêtre, mettre à jour le type dans Grid
        if (btn.dataset.wtype) {
            Grid.windowType = btn.dataset.wtype;
        }
        // Cacher les sous-types fenêtre si on change d'outil
        if (type !== 'window') {
            const wt = document.getElementById('three-win-types');
            if (wt) wt.style.display = 'none';
        }
    },

    toggleWinTypes() {
        const wt = document.getElementById('three-win-types');
        if (wt) wt.style.display = wt.style.display === 'none' ? '' : 'none';
    },

    setWinType3D(btn) {
        Grid.windowType = btn.dataset.wtype;
        document.querySelectorAll('.win-sub').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    },

    setEditFloor(index, btn) {
        this.editFloor = index;
        document.querySelectorAll('.three-edit-floor-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');

        // Show this floor and focus
        this.showFloor(index, document.querySelectorAll('.three-floor-btn')[index + 1]);
        this.showEditGrid();
    },

    // ===== EDIT GRID (visual helper on the floor) =====
    showEditGrid() {
        this.removeEditGrid();
        const baseY = this.editFloor * this.FLOOR_HEIGHT + 0.07;
        const offsetX = -(Grid.COLS * this.CELL_SIZE) / 2;
        const offsetZ = -(Grid.ROWS * this.CELL_SIZE) / 2;
        const s = this.CELL_SIZE;

        this.gridHelperFloor = new THREE.Group();
        this.gridHelperFloor.name = 'editGrid';

        // Draw grid lines
        const mat = new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.25 });

        // Horizontal lines
        for (let r = 0; r <= Grid.ROWS; r++) {
            const points = [
                new THREE.Vector3(offsetX, baseY, offsetZ + r * s),
                new THREE.Vector3(offsetX + Grid.COLS * s, baseY, offsetZ + r * s)
            ];
            const geo = new THREE.BufferGeometry().setFromPoints(points);
            this.gridHelperFloor.add(new THREE.Line(geo, mat));
        }
        // Vertical lines
        for (let c = 0; c <= Grid.COLS; c++) {
            const points = [
                new THREE.Vector3(offsetX + c * s, baseY, offsetZ),
                new THREE.Vector3(offsetX + c * s, baseY, offsetZ + Grid.ROWS * s)
            ];
            const geo = new THREE.BufferGeometry().setFromPoints(points);
            this.gridHelperFloor.add(new THREE.Line(geo, mat));
        }

        this.scene.add(this.gridHelperFloor);

        // Create transparent floor plane for raycasting (visible:false = raycaster ignores it!)
        if (this.floorPlane) this.scene.remove(this.floorPlane);
        const planeGeo = new THREE.PlaneGeometry(Grid.COLS * s, Grid.ROWS * s);
        const planeMat = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        this.floorPlane = new THREE.Mesh(planeGeo, planeMat);
        this.floorPlane.rotation.x = -Math.PI / 2;
        this.floorPlane.position.set(0, baseY, 0);
        this.scene.add(this.floorPlane);
    },

    removeEditGrid() {
        if (this.gridHelperFloor) {
            this.scene.remove(this.gridHelperFloor);
            this.gridHelperFloor = null;
        }
        if (this.floorPlane) {
            this.scene.remove(this.floorPlane);
            this.floorPlane = null;
        }
    },

    // ===== RAYCASTING: mouse → grid coords =====
    getGridCoordsFromMouse(e) {
        if (!this.floorPlane || !this.renderer) return null;

        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const hits = this.raycaster.intersectObject(this.floorPlane);
        if (hits.length === 0) return null;

        const pt = hits[0].point;
        const offsetX = -(Grid.COLS * this.CELL_SIZE) / 2;
        const offsetZ = -(Grid.ROWS * this.CELL_SIZE) / 2;

        const col = Math.floor((pt.x - offsetX) / this.CELL_SIZE);
        const row = Math.floor((pt.z - offsetZ) / this.CELL_SIZE);

        if (row < 0 || row >= Grid.ROWS || col < 0 || col >= Grid.COLS) return null;
        return { r: row, c: col };
    },

    // ===== 3D MOUSE HANDLERS =====
    // Detect nearest edge of a cell from 3D hit point
    detectEdge3D(e) {
        if (!this.floorPlane || !this.renderer) return null;

        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const hits = this.raycaster.intersectObject(this.floorPlane);
        if (hits.length === 0) return null;

        const pt = hits[0].point;
        const s = this.CELL_SIZE;
        const offsetX = -(Grid.COLS * s) / 2;
        const offsetZ = -(Grid.ROWS * s) / 2;

        // Position relative dans la grille
        const rx = (pt.x - offsetX) / s;
        const rz = (pt.z - offsetZ) / s;
        const col = Math.floor(rx);
        const row = Math.floor(rz);
        if (row < 0 || row >= Grid.ROWS || col < 0 || col >= Grid.COLS) return null;

        // Distance aux bords
        const fracX = rx - col;
        const fracZ = rz - row;
        const margin = 0.45;
        const orient = Grid.wallOrient; // 'h' ou 'v'

        const dTop = fracZ;
        const dBot = 1 - fracZ;
        const dLeft = fracX;
        const dRight = 1 - fracX;

        // Filtrer selon l'orientation sélectionnée
        if (orient === 'h') {
            const min = Math.min(dTop, dBot);
            if (min > margin) return null;
            if (dTop <= dBot) return `h_${row}_${col}`;
            return `h_${row + 1}_${col}`;
        } else if (orient === 'v') {
            const min = Math.min(dLeft, dRight);
            if (min > margin) return null;
            if (dLeft <= dRight) return `v_${row}_${col}`;
            return `v_${row}_${col + 1}`;
        }

        // Auto / porte / fenêtre / gomme : bord le plus proche
        const min = Math.min(dTop, dBot, dLeft, dRight);
        if (min > 0.3) return null;
        if (min === dTop) return `h_${row}_${col}`;
        if (min === dBot) return `h_${row + 1}_${col}`;
        if (min === dLeft) return `v_${row}_${col}`;
        return `v_${row}_${col + 1}`;
    },

    isDrawingEdge3D: false,  // drag continu murs en 3D
    lastEdge3D: null,        // dernier edge posé (éviter doublons pendant drag)

    placeEdge3D(edge) {
        const fi = this.editFloor;
        if (!Grid.walls[fi]) Grid.walls[fi] = {};
        if (!Grid.doors[fi]) Grid.doors[fi] = {};
        if (!Grid.windows[fi]) Grid.windows[fi] = {};

        if (this.drawType === 'wall') {
            delete Grid.doors[fi][edge];
            delete Grid.windows[fi][edge];
            Grid.walls[fi][edge] = true;
        } else if (this.drawType === 'door') {
            delete Grid.windows[fi][edge];
            Grid.walls[fi][edge] = true;
            Grid.doors[fi][edge] = true;
        } else if (this.drawType === 'window') {
            delete Grid.doors[fi][edge];
            Grid.walls[fi][edge] = true;
            Grid.windows[fi][edge] = Grid.windowType || 'simple';
        } else if (this.drawType === 'erase-wall') {
            delete Grid.walls[fi][edge];
            delete Grid.doors[fi][edge];
            delete Grid.windows[fi][edge];
        }
        this.rebuildFloor(fi);
        // Sync 2D
        if (Grid.currentFloor === fi) { Grid.restoreFloor(); Grid.updateRoomsList(); }
    },

    onMouseDown3D(e) {
        if (!this.drawMode || e.button !== 0) return;

        // Wall/door modes : clic direct + début drag
        if (['wall', 'door', 'window', 'erase-wall'].includes(this.drawType)) {
            const edge = this.detectEdge3D(e);
            if (!edge) return;
            this.isDrawingEdge3D = true;
            this.lastEdge3D = edge;
            this.placeEdge3D(edge);
            return;
        }

        const coords = this.getGridCoordsFromMouse(e);
        if (!coords) return;

        // Equipment modes: single click
        if (this.drawType && this.drawType.startsWith('equip-')) {
            this.handleEquip3D(coords.r, coords.c);
            return;
        }

        this.isDrawing3D = true;
        this.startCell3D = coords;

        if (this.drawType === 'eraser') {
            this.eraseCell3D(coords.r, coords.c);
        }
    },

    onMouseMove3D(e) {
        if (!this.drawMode) return;

        // Wall/door hover preview in 3D + drag continu
        if (['wall', 'door', 'window', 'erase-wall'].includes(this.drawType)) {
            this.updateEdgeHover3D(e);
            if (this.renderer) this.renderer.domElement.style.cursor = 'crosshair';
            // Drag continu : poser en déplaçant la souris
            if (this.isDrawingEdge3D) {
                const edge = this.detectEdge3D(e);
                if (edge && edge !== this.lastEdge3D) {
                    this.lastEdge3D = edge;
                    this.placeEdge3D(edge);
                }
            }
            return;
        }

        const coords = this.getGridCoordsFromMouse(e);

        // Hover indicator (always in draw mode)
        this.updateHover(coords);

        // Change cursor
        if (this.renderer) {
            this.renderer.domElement.style.cursor = coords ? 'crosshair' : 'default';
        }

        // Drag preview
        if (!this.isDrawing3D || this.drawType === 'eraser') return;
        if (!coords) return;

        this.clearPreview3D();
        this.showPreview3D(this.startCell3D.r, this.startCell3D.c, coords.r, coords.c);
    },

    updateHover(coords) {
        // Remove old hover
        if (this.hoverMesh) {
            this.scene.remove(this.hoverMesh);
            this.hoverMesh.geometry.dispose();
            this.hoverMesh.material.dispose();
            this.hoverMesh = null;
        }
        if (!coords) return;

        const s = this.CELL_SIZE;
        const offsetX = -(Grid.COLS * s) / 2;
        const offsetZ = -(Grid.ROWS * s) / 2;
        const baseY = this.editFloor * this.FLOOR_HEIGHT;
        const color = this.drawType === 'eraser' ? '#ff5555' :
                      this.drawType.startsWith('equip-') ? '#ffcc00' :
                      (Grid.ROOM_COLORS[this.drawType] || '#00d4ff');

        const geo = new THREE.BoxGeometry(s * 0.92, 0.08, s * 0.92);
        const mat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(color),
            transparent: true,
            opacity: 0.5
        });
        this.hoverMesh = new THREE.Mesh(geo, mat);
        this.hoverMesh.position.set(
            offsetX + coords.c * s + s / 2,
            baseY + 0.1,
            offsetZ + coords.r * s + s / 2
        );
        this.scene.add(this.hoverMesh);
    },

    onMouseUp3D(e) {
        // Stop edge drag
        this.isDrawingEdge3D = false;
        this.lastEdge3D = null;

        if (!this.drawMode || !this.isDrawing3D) return;
        this.isDrawing3D = false;

        if (this.drawType === 'eraser') return;

        const coords = this.getGridCoordsFromMouse(e);
        if (!coords) { this.clearPreview3D(); return; }

        this.clearPreview3D();
        this.placeRect3D(this.startCell3D.r, this.startCell3D.c, coords.r, coords.c);
    },

    // ===== PREVIEW =====
    showPreview3D(r1, c1, r2, c2) {
        const minR = Math.min(r1, r2), maxR = Math.max(r1, r2);
        const minC = Math.min(c1, c2), maxC = Math.max(c1, c2);
        const color = Grid.ROOM_COLORS[this.drawType] || '#888888';
        const s = this.CELL_SIZE;
        const offsetX = -(Grid.COLS * s) / 2;
        const offsetZ = -(Grid.ROWS * s) / 2;
        const baseY = this.editFloor * this.FLOOR_HEIGHT;

        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
                const geo = new THREE.BoxGeometry(s * 0.95, 0.3, s * 0.95);
                const mat = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(color),
                    transparent: true,
                    opacity: 0.4,
                    emissive: new THREE.Color(color),
                    emissiveIntensity: 0.3
                });
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(
                    offsetX + c * s + s / 2,
                    baseY + 0.2,
                    offsetZ + r * s + s / 2
                );
                this.scene.add(mesh);
                this.previewMeshes.push(mesh);
            }
        }
    },

    clearPreview3D() {
        this.previewMeshes.forEach(m => {
            this.scene.remove(m);
            m.geometry.dispose();
            m.material.dispose();
        });
        this.previewMeshes = [];
    },

    // ===== PLACE / ERASE =====
    placeRect3D(r1, c1, r2, c2) {
        const fi = this.editFloor;
        const type = this.drawType;

        // Use Grid's data model (same as 2D)
        if (!Grid.floors[fi]) Grid.floors[fi] = {};
        const floorData = Grid.floors[fi];
        const s = this.CELL_SIZE;
        const minR = Math.min(r1, r2), maxR = Math.max(r1, r2);
        const minC = Math.min(c1, c2), maxC = Math.max(c1, c2);

        // Find or create room key (same merge logic as Grid)
        let roomKey = null;
        let counter = 0;
        while (floorData[`${type}_${counter}`]) counter++;

        for (const key in floorData) {
            if (!key.startsWith(type + '_')) continue;
            const room = floorData[key];
            for (let r = minR; r <= maxR; r++) {
                for (let c = minC; c <= maxC; c++) {
                    if (Grid.isAdjacentTo(r, c, room.cells)) {
                        roomKey = key;
                        break;
                    }
                }
                if (roomKey) break;
            }
            if (roomKey) break;
        }
        if (!roomKey) {
            roomKey = `${type}_${counter}`;
            floorData[roomKey] = { type: type, cells: [] };
        }

        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
                const cellKey = `${r}_${c}`;
                // Check not already occupied
                let occupied = false;
                for (const k in floorData) {
                    if (floorData[k].cells && floorData[k].cells.includes(cellKey)) {
                        occupied = true;
                        break;
                    }
                }
                if (!occupied) {
                    floorData[roomKey].cells.push(cellKey);
                }
            }
        }

        // Rebuild 3D for this floor
        this.rebuildFloor(fi);

        // Sync 2D grid if visible
        if (Grid.currentFloor === fi) {
            Grid.restoreFloor();
            Grid.updateRoomsList();
        }
    },

    eraseCell3D(r, c) {
        const fi = this.editFloor;
        const floorData = Grid.floors[fi] || {};
        const cellKey = `${r}_${c}`;

        for (const key in floorData) {
            const idx = floorData[key].cells.indexOf(cellKey);
            if (idx !== -1) {
                floorData[key].cells.splice(idx, 1);
                if (floorData[key].cells.length === 0) delete floorData[key];
                break;
            }
        }

        // Remove equips
        if (Grid.equips[fi]) delete Grid.equips[fi][cellKey];

        this.rebuildFloor(fi);
    },

    handleEquip3D(r, c) {
        const fi = this.editFloor;
        const cellKey = `${r}_${c}`;

        // Check cell is occupied
        const floorData = Grid.floors[fi] || {};
        let inRoom = false;
        for (const key in floorData) {
            if (floorData[key].cells && floorData[key].cells.includes(cellKey)) {
                inRoom = true;
                break;
            }
        }
        if (!inRoom) return;

        if (!Grid.equips[fi]) Grid.equips[fi] = {};

        if (this.drawType === 'equip-erase') {
            delete Grid.equips[fi][cellKey];
        } else {
            const eqType = this.drawType.replace('equip-', '');
            if (!Grid.equips[fi][cellKey]) Grid.equips[fi][cellKey] = [];
            Grid.equips[fi][cellKey].push({
                type: eqType,
                icon: Grid.EQUIP_ICONS[eqType]
            });
        }

        this.rebuildFloor(fi);
    },

    // ===== REBUILD A SINGLE FLOOR =====
    rebuildFloor(fi) {
        // Remove old group
        const oldGroup = this.floorGroups[fi];
        if (oldGroup) {
            this.scene.remove(oldGroup);
            // Dispose geometries/materials
            oldGroup.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (child.material.map) child.material.map.dispose();
                    child.material.dispose();
                }
            });
        }

        // Rebuild
        const group = new THREE.Group();
        group.name = `floor_${fi}`;
        const etages = projet.etages || [{ nom: 'RDC', numero: 0 }];
        const offsetX = -(Grid.COLS * this.CELL_SIZE) / 2;
        const offsetZ = -(Grid.ROWS * this.CELL_SIZE) / 2;
        const floorData = Grid.floors[fi] || {};
        const equipFloor = Grid.equips[fi] || {};
        const baseY = fi * this.FLOOR_HEIGHT;

        this.addFloorSlab(group, offsetX, baseY, offsetZ);

        for (const key in floorData) {
            const room = floorData[key];
            if (!room.cells || room.cells.length === 0) continue;
            const color = Grid.ROOM_COLORS[room.type] || '#888888';
            const threeColor = this.hexToThreeColor(color);

            room.cells.forEach(cellKey => {
                const [r, c] = cellKey.split('_').map(Number);
                const x = offsetX + c * this.CELL_SIZE;
                const z = offsetZ + r * this.CELL_SIZE;
                this.addRoomFloor(group, x, baseY, z, threeColor);
                const eqs = equipFloor[cellKey] || [];
                eqs.forEach((eq, ei) => {
                    this.addEquipMarker(group, x, baseY, z, eq.type, ei, eqs.length);
                });
            });
        }

        // Murs manuels + portes
        this.addManualWalls(group, fi, offsetX, baseY, offsetZ);

        this.addFloorLabel(group, etages[fi]?.nom || `Étage ${fi}`, offsetX - 1.2, baseY + this.WALL_HEIGHT / 2, offsetZ);

        this.scene.add(group);
        this.floorGroups[fi] = group;

        // Re-apply visibility
        if (this.activeFloor !== -1) {
            this.floorGroups.forEach((g, i) => {
                if (g) g.visible = (i === this.activeFloor);
            });
        }

        // Re-show edit grid on top
        if (this.drawMode) this.showEditGrid();
    },

    // ===== SHOW / HIDE FLOORS =====
    showFloor(index, btn) {
        this.activeFloor = index;
        document.querySelectorAll('.three-floor-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');

        if (index === -1) {
            this.floorGroups.forEach(g => { if (g) g.visible = true; });
            this.focusAll();
        } else {
            this.floorGroups.forEach((g, i) => { if (g) g.visible = (i === index); });
            this.focusFloor(index);
            if (this.drawMode) {
                this.editFloor = index;
                this.showEditGrid();
                this.buildDrawFloorSelect();
            }
        }
    },

    focusAll() {
        const etages = projet.etages || [{ nom: 'RDC', numero: 0 }];
        const totalHeight = etages.length * this.FLOOR_HEIGHT;
        const centerY = totalHeight / 2;
        const dist = Math.max(Grid.COLS, Grid.ROWS) * this.CELL_SIZE * 0.8 + totalHeight;
        this.camera.position.set(dist * 0.7, dist * 0.6, dist * 0.7);
        this.controls.target.set(0, centerY, 0);
        this.controls.update();
    },

    focusFloor(index) {
        const baseY = index * this.FLOOR_HEIGHT;
        const centerY = baseY + this.WALL_HEIGHT / 2;
        const dist = Math.max(Grid.COLS, Grid.ROWS) * this.CELL_SIZE * 0.7;
        this.camera.position.set(dist * 0.6, centerY + dist * 0.5, dist * 0.6);
        this.controls.target.set(0, centerY, 0);
        this.controls.update();
    },

    // ===== BUILD =====
    addGround() {
        const geo = new THREE.PlaneGeometry(40, 40);
        const mat = new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.9 });
        const plane = new THREE.Mesh(geo, mat);
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = -0.01;
        plane.receiveShadow = true;
        this.scene.add(plane);
        this.scene.add(new THREE.GridHelper(20, 40, 0x222244, 0x1a1a30));
    },

    hexToThreeColor(hex) { return new THREE.Color(hex); },

    buildModel() {
        const etages = projet.etages || [{ nom: 'RDC', numero: 0 }];
        const offsetX = -(Grid.COLS * this.CELL_SIZE) / 2;
        const offsetZ = -(Grid.ROWS * this.CELL_SIZE) / 2;

        for (let fi = 0; fi < etages.length; fi++) {
            const group = new THREE.Group();
            group.name = `floor_${fi}`;
            const floorData = Grid.floors[fi] || {};
            const equipFloor = Grid.equips[fi] || {};
            const baseY = fi * this.FLOOR_HEIGHT;

            this.addFloorSlab(group, offsetX, baseY, offsetZ);

            for (const key in floorData) {
                const room = floorData[key];
                if (!room.cells || room.cells.length === 0) continue;
                const color = Grid.ROOM_COLORS[room.type] || '#888888';
                const threeColor = this.hexToThreeColor(color);

                room.cells.forEach(cellKey => {
                    const [r, c] = cellKey.split('_').map(Number);
                    const x = offsetX + c * this.CELL_SIZE;
                    const z = offsetZ + r * this.CELL_SIZE;
                    this.addRoomFloor(group, x, baseY, z, threeColor);
                    const eqs = equipFloor[cellKey] || [];
                    eqs.forEach((eq, ei) => {
                        this.addEquipMarker(group, x, baseY, z, eq.type, ei, eqs.length);
                    });
                });
            }

            // Murs manuels + portes
            this.addManualWalls(group, fi, offsetX, baseY, offsetZ);

            this.addFloorLabel(group, etages[fi].nom, offsetX - 1.2, baseY + this.WALL_HEIGHT / 2, offsetZ);
            this.scene.add(group);
            this.floorGroups.push(group);
        }
    },

    addFloorSlab(group, offsetX, baseY, offsetZ) {
        const geo = new THREE.BoxGeometry(Grid.COLS * this.CELL_SIZE, 0.05, Grid.ROWS * this.CELL_SIZE);
        const mat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.8 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(offsetX + (Grid.COLS * this.CELL_SIZE) / 2, baseY, offsetZ + (Grid.ROWS * this.CELL_SIZE) / 2);
        mesh.receiveShadow = true;
        group.add(mesh);
    },

    addRoomFloor(group, x, baseY, z, color) {
        const geo = new THREE.BoxGeometry(this.CELL_SIZE, 0.06, this.CELL_SIZE);
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, transparent: true, opacity: 0.7 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x + this.CELL_SIZE / 2, baseY + 0.03, z + this.CELL_SIZE / 2);
        mesh.receiveShadow = true;
        group.add(mesh);
    },

    // ===== MURS MANUELS =====
    addManualWalls(group, fi, offsetX, baseY, offsetZ) {
        const s = this.CELL_SIZE;
        const h = this.WALL_HEIGHT;
        const thickness = 0.05;
        const wallObj = Grid.walls[fi] || {};
        const doorObj = Grid.doors[fi] || {};
        const winObj = Grid.windows[fi] || {};

        const wallMat = new THREE.MeshStandardMaterial({
            color: 0xcccccc, roughness: 0.4, metalness: 0.1
        });
        const doorFrameMat = new THREE.MeshStandardMaterial({
            color: 0x8B4513, roughness: 0.6 // brun bois
        });

        // Matériau verre fenêtre
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x90caf9, transparent: true, opacity: 0.4, roughness: 0.1, metalness: 0.3
        });
        const windowFrameMat = new THREE.MeshStandardMaterial({
            color: 0x5c6bc0, roughness: 0.5
        });

        Object.keys(wallObj).forEach(edgeKey => {
            const isDoor = !!doorObj[edgeKey];
            const isWindow = !!winObj[edgeKey];
            const parts = edgeKey.split('_');
            const orientation = parts[0]; // 'h', 'v', 'd1', 'd2'
            const er = parseInt(parts[1]);
            const ec = parseInt(parts[2]);

            // Diagonal walls (d1 = \, d2 = /)
            if (orientation === 'd1' || orientation === 'd2') {
                const diagLen = Math.sqrt(s * s + s * s); // longueur diagonale
                const cx = offsetX + ec * s + s / 2;
                const cz = offsetZ + er * s + s / 2;
                const angle = orientation === 'd1' ? Math.PI / 4 : -Math.PI / 4;

                if (isDoor) {
                    const doorH = h * 0.8;
                    const tgeo = new THREE.BoxGeometry(diagLen, h - doorH, thickness);
                    const tm = new THREE.Mesh(tgeo, wallMat);
                    tm.position.set(cx, baseY + doorH + (h - doorH) / 2, cz);
                    tm.rotation.y = -angle;
                    tm.castShadow = true;
                    group.add(tm);
                    const frameW = 0.03;
                    const halfLen = diagLen / 2 - frameW / 2;
                    [-1, 1].forEach(side => {
                        const fgeo = new THREE.BoxGeometry(frameW, doorH, thickness);
                        const fm = new THREE.Mesh(fgeo, doorFrameMat);
                        fm.position.set(cx + Math.cos(angle) * halfLen * side, baseY + doorH / 2, cz + Math.sin(angle) * halfLen * side);
                        fm.rotation.y = -angle;
                        fm.castShadow = true;
                        group.add(fm);
                    });
                } else if (isWindow) {
                    // Fenêtre diagonale : mur bas + mur haut + vitre au milieu
                    const winBottom = h * 0.3;
                    const winTop = h * 0.15;
                    const winH = h - winBottom - winTop;
                    // Mur bas
                    const bgeo = new THREE.BoxGeometry(diagLen, winBottom, thickness);
                    const bm = new THREE.Mesh(bgeo, wallMat);
                    bm.position.set(cx, baseY + winBottom / 2, cz);
                    bm.rotation.y = -angle; bm.castShadow = true; group.add(bm);
                    // Mur haut
                    const tgeo2 = new THREE.BoxGeometry(diagLen, winTop, thickness);
                    const tm2 = new THREE.Mesh(tgeo2, wallMat);
                    tm2.position.set(cx, baseY + h - winTop / 2, cz);
                    tm2.rotation.y = -angle; tm2.castShadow = true; group.add(tm2);
                    // Vitre
                    const ggeo = new THREE.BoxGeometry(diagLen * 0.9, winH, thickness * 0.5);
                    const gm = new THREE.Mesh(ggeo, glassMat);
                    gm.position.set(cx, baseY + winBottom + winH / 2, cz);
                    gm.rotation.y = -angle; group.add(gm);
                    // Cadre
                    const frameW2 = 0.02;
                    const halfLen2 = diagLen / 2 - frameW2 / 2;
                    [-1, 1].forEach(side => {
                        const fgeo = new THREE.BoxGeometry(frameW2, winH, thickness);
                        const fm = new THREE.Mesh(fgeo, windowFrameMat);
                        fm.position.set(cx + Math.cos(angle) * halfLen2 * side, baseY + winBottom + winH / 2, cz + Math.sin(angle) * halfLen2 * side);
                        fm.rotation.y = -angle; group.add(fm);
                    });
                } else {
                    const geo = new THREE.BoxGeometry(diagLen, h, thickness);
                    const wall = new THREE.Mesh(geo, wallMat);
                    wall.position.set(cx, baseY + h / 2, cz);
                    wall.rotation.y = -angle;
                    wall.castShadow = true;
                    group.add(wall);
                }
                return;
            }

            let px, pz, sx, sz;
            if (orientation === 'h') {
                // Horizontal edge: top of row er, column ec
                px = offsetX + ec * s + s / 2;
                pz = offsetZ + er * s;
                sx = s;
                sz = thickness;
            } else {
                // Vertical edge: left of column ec, row er
                px = offsetX + ec * s;
                pz = offsetZ + er * s + s / 2;
                sx = thickness;
                sz = s;
            }

            if (isDoor) {
                // Porte: deux montants + linteau
                const doorH = h * 0.8;
                const doorW = (orientation === 'h' ? sx : sz) * 0.6;
                const frameW = 0.03;

                // Montant gauche
                const lgeo = new THREE.BoxGeometry(
                    orientation === 'h' ? frameW : thickness,
                    doorH,
                    orientation === 'h' ? thickness : frameW
                );
                const lm = new THREE.Mesh(lgeo, doorFrameMat);
                const offsetLeft = (orientation === 'h' ? sx : sz) / 2 - frameW / 2;
                lm.position.set(
                    px - (orientation === 'h' ? offsetLeft : 0),
                    baseY + doorH / 2,
                    pz - (orientation === 'v' ? offsetLeft : 0)
                );
                lm.castShadow = true;
                group.add(lm);

                // Montant droit
                const rm = new THREE.Mesh(lgeo, doorFrameMat);
                rm.position.set(
                    px + (orientation === 'h' ? offsetLeft : 0),
                    baseY + doorH / 2,
                    pz + (orientation === 'v' ? offsetLeft : 0)
                );
                rm.castShadow = true;
                group.add(rm);

                // Linteau au-dessus
                const tgeo = new THREE.BoxGeometry(sx, h - doorH, sz);
                const tm = new THREE.Mesh(tgeo, wallMat);
                tm.position.set(px, baseY + doorH + (h - doorH) / 2, pz);
                tm.castShadow = true;
                group.add(tm);
            } else if (isWindow) {
                // Fenêtre H/V — le rendu varie selon le type
                const wtype = winObj[edgeKey] || 'simple';
                const wallLen = orientation === 'h' ? sx : sz;
                this.addWindow3D(group, wtype, orientation, px, pz, baseY, sx, sz, h, thickness, wallMat, glassMat, windowFrameMat);
            } else {
                // Mur plein
                const geo = new THREE.BoxGeometry(sx, h, sz);
                const wall = new THREE.Mesh(geo, wallMat);
                wall.position.set(px, baseY + h / 2, pz);
                wall.castShadow = true;
                group.add(wall);
            }
        });
    },

    // ===== PRISES / ÉQUIPEMENTS (forme plate réaliste) =====
    addEquipMarker(group, x, baseY, z, eqType, index, total) {
        const s = this.CELL_SIZE;
        const spacing = s / (total + 1);
        const posX = x + spacing * (index + 1);
        const posZ = z + s / 2;

        if (eqType === 'prise' || eqType === 'double') {
            // Plaque murale (boîtier blanc/crème)
            const plateW = eqType === 'double' ? 0.14 : 0.08;
            const plateH = 0.1;
            const plateD = 0.015;

            const plateGeo = new THREE.BoxGeometry(plateW, plateH, plateD);
            const plateMat = new THREE.MeshStandardMaterial({
                color: 0xf0ece0, roughness: 0.3, metalness: 0.05
            });
            const plate = new THREE.Mesh(plateGeo, plateMat);
            plate.position.set(posX, baseY + 0.2, posZ);
            group.add(plate);

            // Trous de prise (petits cylindres sombres)
            const holeCount = eqType === 'double' ? 2 : 1;
            for (let hi = 0; hi < holeCount; hi++) {
                const offsetHole = holeCount === 1 ? 0 : (hi === 0 ? -0.03 : 0.03);

                // Deux trous ronds par prise
                [-0.012, 0.012].forEach(dy => {
                    const holeGeo = new THREE.CylinderGeometry(0.006, 0.006, plateD + 0.005, 8);
                    const holeMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
                    const hole = new THREE.Mesh(holeGeo, holeMat);
                    hole.rotation.x = Math.PI / 2;
                    hole.position.set(posX + offsetHole, baseY + 0.2 + dy, posZ);
                    group.add(hole);
                });

                // Trou de terre (en bas)
                const earthGeo = new THREE.CylinderGeometry(0.005, 0.005, plateD + 0.005, 8);
                const earthMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
                const earth = new THREE.Mesh(earthGeo, earthMat);
                earth.rotation.x = Math.PI / 2;
                earth.position.set(posX + offsetHole, baseY + 0.2 - 0.025, posZ);
                group.add(earth);
            }
        } else if (eqType === 'interrupteur') {
            // Plaque interrupteur
            const plateGeo = new THREE.BoxGeometry(0.08, 0.08, 0.015);
            const plateMat = new THREE.MeshStandardMaterial({
                color: 0xf0ece0, roughness: 0.3, metalness: 0.05
            });
            const plate = new THREE.Mesh(plateGeo, plateMat);
            plate.position.set(posX, baseY + 0.6, posZ);
            group.add(plate);

            // Bouton bascule
            const btnGeo = new THREE.BoxGeometry(0.03, 0.04, 0.02);
            const btnMat = new THREE.MeshStandardMaterial({
                color: 0xdddddd, roughness: 0.2, metalness: 0.1
            });
            const btn = new THREE.Mesh(btnGeo, btnMat);
            btn.position.set(posX, baseY + 0.6, posZ + 0.005);
            btn.rotation.x = -0.2; // légèrement incliné (position ON)
            group.add(btn);
        }
    },

    // ===== RENDU FENÊTRE 3D PAR TYPE =====
    addWindow3D(group, wtype, orient, px, pz, baseY, sx, sz, h, thickness, wallMat, glassMat, frameMat) {
        // Paramètres par type
        const types = {
            simple:  { bottomRatio: 0.35, topRatio: 0.15, glassScale: 0.7 },
            double:  { bottomRatio: 0.30, topRatio: 0.10, glassScale: 0.9, divider: true },
            baie:    { bottomRatio: 0.05, topRatio: 0.05, glassScale: 0.95 },
            velux:   { bottomRatio: 0.40, topRatio: 0.20, glassScale: 0.5 },
            oeil:    { bottomRatio: 0.35, topRatio: 0.25, glassScale: 0.35, round: true },
        };
        const cfg = types[wtype] || types.simple;
        const winBottom = h * cfg.bottomRatio;
        const winTop = h * cfg.topRatio;
        const winH = h - winBottom - winTop;
        const wallLen = orient === 'h' ? sx : sz;

        // Mur bas (allège)
        const bgeo = new THREE.BoxGeometry(sx, winBottom, sz);
        const bm = new THREE.Mesh(bgeo, wallMat);
        bm.position.set(px, baseY + winBottom / 2, pz);
        bm.castShadow = true;
        group.add(bm);

        // Mur haut (linteau)
        const tgeo = new THREE.BoxGeometry(sx, winTop, sz);
        const tm = new THREE.Mesh(tgeo, wallMat);
        tm.position.set(px, baseY + h - winTop / 2, pz);
        tm.castShadow = true;
        group.add(tm);

        // Vitre
        const glassW = orient === 'h' ? sx * cfg.glassScale : thickness * 0.5;
        const glassD = orient === 'h' ? thickness * 0.5 : sz * cfg.glassScale;

        if (cfg.round) {
            // Œil-de-bœuf : sphère aplatie comme vitre
            const radius = Math.min(winH, wallLen * cfg.glassScale) / 2;
            const sgeo = new THREE.SphereGeometry(radius, 16, 16);
            sgeo.scale(1, 1, 0.15);
            const sm = new THREE.Mesh(sgeo, glassMat);
            sm.position.set(px, baseY + winBottom + winH / 2, pz);
            if (orient === 'v') sm.rotation.y = Math.PI / 2;
            group.add(sm);
            // Anneau cadre
            const rgeo = new THREE.TorusGeometry(radius, 0.015, 8, 24);
            const rm = new THREE.Mesh(rgeo, frameMat);
            rm.position.set(px, baseY + winBottom + winH / 2, pz);
            if (orient === 'h') rm.rotation.x = Math.PI / 2;
            else { rm.rotation.x = Math.PI / 2; rm.rotation.z = Math.PI / 2; }
            group.add(rm);
        } else {
            const ggeo = new THREE.BoxGeometry(glassW, winH, glassD);
            const gm = new THREE.Mesh(ggeo, glassMat);
            gm.position.set(px, baseY + winBottom + winH / 2, pz);
            group.add(gm);

            // Cadres latéraux
            const frameW = 0.02;
            const halfLen = wallLen * cfg.glassScale / 2 - frameW / 2;
            [-1, 1].forEach(side => {
                const fgeo = new THREE.BoxGeometry(
                    orient === 'h' ? frameW : thickness,
                    winH,
                    orient === 'h' ? thickness : frameW
                );
                const fm = new THREE.Mesh(fgeo, frameMat);
                fm.position.set(
                    px + (orient === 'h' ? halfLen * side : 0),
                    baseY + winBottom + winH / 2,
                    pz + (orient === 'v' ? halfLen * side : 0)
                );
                group.add(fm);
            });

            // Traverse centrale pour double fenêtre
            if (cfg.divider) {
                const dgeo = new THREE.BoxGeometry(
                    orient === 'h' ? frameW : thickness,
                    winH,
                    orient === 'h' ? thickness : frameW
                );
                const dm = new THREE.Mesh(dgeo, frameMat);
                dm.position.set(px, baseY + winBottom + winH / 2, pz);
                group.add(dm);
            }

            // Traverse horizontale pour velux (croisillon)
            if (wtype === 'velux') {
                const hgeo = new THREE.BoxGeometry(glassW, frameW, glassD);
                const hm = new THREE.Mesh(hgeo, frameMat);
                hm.position.set(px, baseY + winBottom + winH / 2, pz);
                group.add(hm);
            }
        }

        // Murs latéraux pour remplir les côtés (si glassScale < 1)
        if (cfg.glassScale < 0.95 && !cfg.round) {
            const sideW = wallLen * (1 - cfg.glassScale) / 2;
            [-1, 1].forEach(side => {
                const sgeo = new THREE.BoxGeometry(
                    orient === 'h' ? sideW : sx,
                    winH,
                    orient === 'h' ? sz : sideW
                );
                const sm = new THREE.Mesh(sgeo, wallMat);
                sm.position.set(
                    px + (orient === 'h' ? (wallLen / 2 - sideW / 2) * side : 0),
                    baseY + winBottom + winH / 2,
                    pz + (orient === 'v' ? (wallLen / 2 - sideW / 2) * side : 0)
                );
                sm.castShadow = true;
                group.add(sm);
            });
        }
    },

    // ===== PREVIEW MUR/PORTE 3D (avant confirmation) =====
    // Crée un mesh semi-transparent sur l'edge pour prévisualiser
    _buildEdgeMesh(edgeKey, type, opacity) {
        const s = this.CELL_SIZE;
        const h = this.WALL_HEIGHT;
        const thickness = 0.05;
        const fi = this.editFloor;
        const baseY = fi * this.FLOOR_HEIGHT;
        const offsetX = -(Grid.COLS * s) / 2;
        const offsetZ = -(Grid.ROWS * s) / 2;

        const parts = edgeKey.split('_');
        const orient = parts[0];
        const er = parseInt(parts[1]);
        const ec = parseInt(parts[2]);
        const color = type === 'door' ? 0xff9900 : type === 'window' ? 0x42a5f5 : 0xffffff;
        const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
        const meshes = [];

        if (orient === 'd1' || orient === 'd2') {
            const diagLen = Math.sqrt(s * s + s * s);
            const cx = offsetX + ec * s + s / 2;
            const cz = offsetZ + er * s + s / 2;
            const angle = orient === 'd1' ? Math.PI / 4 : -Math.PI / 4;
            const geo = new THREE.BoxGeometry(diagLen, h, thickness);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(cx, baseY + h / 2, cz);
            mesh.rotation.y = -angle;
            meshes.push(mesh);
        } else {
            let px, pz, sx, sz;
            if (orient === 'h') {
                px = offsetX + ec * s + s / 2;
                pz = offsetZ + er * s;
                sx = s; sz = thickness;
            } else {
                px = offsetX + ec * s;
                pz = offsetZ + er * s + s / 2;
                sx = thickness; sz = s;
            }
            const geo = new THREE.BoxGeometry(sx, h, sz);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(px, baseY + h / 2, pz);
            meshes.push(mesh);
        }
        return meshes;
    },

    showEdgePreview3D(edgeKey, type) {
        const meshes = this._buildEdgeMesh(edgeKey, type, 0.6);
        meshes.forEach(m => this.scene.add(m));
        this.pendingEdge3D = { edgeKey, meshes };
    },

    clearPending3D() {
        if (this.pendingEdge3D) {
            this.pendingEdge3D.meshes.forEach(m => {
                this.scene.remove(m);
                m.geometry.dispose();
                m.material.dispose();
            });
            this.pendingEdge3D = null;
        }
    },

    updateEdgeHover3D(e) {
        // Remove old hover mesh
        if (this.edgeHoverMesh) {
            this.edgeHoverMesh.forEach(m => {
                this.scene.remove(m);
                m.geometry.dispose();
                m.material.dispose();
            });
            this.edgeHoverMesh = null;
        }
        const edge = this.detectEdge3D(e);
        if (!edge) return;
        // Ne pas montrer le hover si c'est le pending
        if (this.pendingEdge3D && this.pendingEdge3D.edgeKey === edge) return;
        const meshes = this._buildEdgeMesh(edge, this.drawType, 0.3);
        meshes.forEach(m => this.scene.add(m));
        this.edgeHoverMesh = meshes;
    },

    addFloorLabel(group, text, x, y, z) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 128, 32);
        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(mat);
        sprite.position.set(x, y, z);
        sprite.scale.set(2, 0.5, 1);
        group.add(sprite);
    }
};
