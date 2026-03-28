// ===== GRILLE SIMS =====
const Grid = {
    COLS: 16,
    ROWS: 12,
    CELL: 42,     // taille cellule px
    GAP: 1,       // gap grille px
    currentFloor: 0,
    currentType: 'salon',
    currentEquip: null,
    isDrawing: false,
    startCell: null,
    floors: {},
    equips: {},
    walls: {},    // { floorIndex: { "h_r_c": true, "d1_r_c": true, ... } }
    doors: {},    // { floorIndex: { "h_r_c": true, ... } }
    windows: {},  // { floorIndex: { "h_r_c": "simple"|"double"|"baie"|"velux"|"oeil", ... } }
    windowType: 'simple',  // type de fenêtre actif
    wallOrient: 'h',  // 'h', 'v', 'd'

    ROOM_COLORS: {
        salon: '#4CAF50', chambre: '#2196F3', cuisine: '#FF9800',
        sdb: '#00BCD4', wc: '#9C27B0', couloir: '#795548',
        cave: '#607D8B', garage: '#455A64', bureau: '#E91E63',
    },
    EQUIP_ICONS: { prise: '🔌', double: '🔌🔌', interrupteur: '🔘' },
    EQUIP_NAMES: { prise: 'Prise', double: 'Double prise', interrupteur: 'Interrupteur' },
    ROOM_NAMES: {
        salon: 'Salon', chambre: 'Chambre', cuisine: 'Cuisine',
        sdb: 'Salle de bain', wc: 'WC', couloir: 'Couloir',
        cave: 'Cave', garage: 'Garage', bureau: 'Bureau',
    },

    // ===== INIT =====
    init(floorIndex) {
        this.currentFloor = floorIndex;
        if (!this.floors[floorIndex]) this.floors[floorIndex] = {};
        if (!this.walls[floorIndex]) this.walls[floorIndex] = {};
        if (!this.doors[floorIndex]) this.doors[floorIndex] = {};
        if (!this.windows[floorIndex]) this.windows[floorIndex] = {};
        this.buildGrid();
        this.restoreFloor();
        this.updateRoomsList();
        // Rebuild edge overlay if in wall mode
        if (this.currentEquip && ['wall', 'door', 'window', 'erase-wall'].includes(this.currentEquip)) {
            this.showEdgeOverlay();
        }
    },

    // ===== BUILD GRID =====
    buildGrid() {
        const grid = document.getElementById('grid');
        grid.innerHTML = '';
        for (let r = 0; r < this.ROWS; r++) {
            for (let c = 0; c < this.COLS; c++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                cell.addEventListener('mousedown', (e) => this.onMouseDown(e, r, c));
                cell.addEventListener('mouseenter', (e) => this.onMouseEnter(e, r, c));
                cell.addEventListener('mouseup', (e) => this.onMouseUp(e, r, c));
                cell.addEventListener('touchstart', (e) => { e.preventDefault(); this.onMouseDown(e, r, c); }, { passive: false });
                cell.addEventListener('touchend', (e) => { e.preventDefault(); this.onMouseUp(e, r, c); }, { passive: false });
                grid.appendChild(cell);
            }
        }
        document.addEventListener('mouseup', () => { this.isDrawing = false; this.isDrawingEdge = false; });
    },

    getCell(r, c) {
        return document.querySelector(`.grid-cell[data-row="${r}"][data-col="${c}"]`);
    },

    // ===== PALETTE SELECTION =====
    selectType(el) {
        document.querySelectorAll('.palette-item').forEach(p => p.classList.remove('active'));
        el.classList.add('active');
        this.currentType = el.dataset.type;
        this.currentEquip = null;
        this.hideEdgeOverlay();
    },

    selectEquip(el) {
        document.querySelectorAll('.palette-item').forEach(p => p.classList.remove('active'));
        el.classList.add('active');
        const equip = el.dataset.equip;
        this.currentType = null;
        const orientEl = document.getElementById('wall-orient');
        const winTypeEl = document.getElementById('window-type-selector');

        // Mur Auto / Mur H / Mur V : raccourcis directs
        if (equip === 'wall-auto' || equip === 'wall-h' || equip === 'wall-v') {
            this.currentEquip = 'wall';
            this.wallOrient = equip === 'wall-h' ? 'h' : equip === 'wall-v' ? 'v' : 'auto';
            if (orientEl) orientEl.style.display = 'none';
            if (winTypeEl) winTypeEl.style.display = 'none';
            this.showEdgeOverlay();
            return;
        }

        this.currentEquip = equip;
        const isStruct = ['door', 'window', 'erase-wall'].includes(this.currentEquip);
        if (isStruct) {
            if (this.currentEquip === 'erase-wall') {
                if (orientEl) orientEl.style.display = 'none';
                if (winTypeEl) winTypeEl.style.display = 'none';
                this.showEraseOverlay();
            } else {
                this.wallOrient = 'h';
                if (orientEl) {
                    orientEl.style.display = '';
                    orientEl.querySelectorAll('.orient-btn').forEach(b => {
                        b.classList.toggle('active', b.dataset.orient === 'h');
                    });
                }
                // Afficher type fenêtre uniquement pour l'outil fenêtre
                if (winTypeEl) winTypeEl.style.display = this.currentEquip === 'window' ? '' : 'none';
                this.showEdgeOverlay();
            }
        } else {
            this.hideEdgeOverlay();
            if (orientEl) orientEl.style.display = 'none';
            if (winTypeEl) winTypeEl.style.display = 'none';
        }
    },

    setWallOrient(orient, btn) {
        this.wallOrient = orient;
        document.querySelectorAll('.orient-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        if (['wall', 'door', 'window', 'erase-wall'].includes(this.currentEquip)) {
            this.showEdgeOverlay();
        }
    },

    setWindowType(wtype, btn) {
        this.windowType = wtype;
        document.querySelectorAll('.win-type-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
    },

    WINDOW_NAMES: {
        simple: 'Simple', double: 'Double', baie: 'Baie vitrée', velux: 'Velux', oeil: 'Œil-de-bœuf'
    },

    // ===== MOUSE HANDLERS (pièces + équipements) =====
    onMouseDown(e, r, c) {
        e.preventDefault();
        // Équipements (prises, etc.)
        if (this.currentEquip && !['wall', 'door', 'window', 'erase-wall'].includes(this.currentEquip)) {
            this.handleEquipClick(r, c);
            return;
        }
        // Pièces
        if (!this.currentType) return;
        this.isDrawing = true;
        this.startCell = { r, c };
        if (this.currentType === 'eraser') {
            this.eraseCell(r, c);
        } else {
            this.clearPreview();
            this.previewRect(r, c, r, c);
        }
    },

    onMouseEnter(e, r, c) {
        if (!this.currentType || !this.isDrawing) return;
        if (this.currentType === 'eraser') { this.eraseCell(r, c); return; }
        this.clearPreview();
        this.previewRect(this.startCell.r, this.startCell.c, r, c);
    },

    onMouseUp(e, r, c) {
        if (!this.currentType || !this.isDrawing) return;
        this.isDrawing = false;
        if (this.currentType === 'eraser') return;
        this.clearPreview();
        this.placeRect(this.startCell.r, this.startCell.c, r, c);
    },

    // ===== ROOM DRAWING =====
    previewRect(r1, c1, r2, c2) {
        const minR = Math.min(r1, r2), maxR = Math.max(r1, r2);
        const minC = Math.min(c1, c2), maxC = Math.max(c1, c2);
        const color = this.ROOM_COLORS[this.currentType] || '#888';
        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
                const cell = this.getCell(r, c);
                if (cell && !cell.classList.contains('occupied')) {
                    cell.style.background = color + '44';
                    cell.classList.add('preview');
                }
            }
        }
    },

    clearPreview() {
        document.querySelectorAll('.grid-cell.preview').forEach(cell => {
            cell.style.background = '';
            cell.classList.remove('preview');
        });
    },

    placeRect(r1, c1, r2, c2) {
        const minR = Math.min(r1, r2), maxR = Math.max(r1, r2);
        const minC = Math.min(c1, c2), maxC = Math.max(c1, c2);
        const type = this.currentType;
        const color = this.ROOM_COLORS[type];
        const floorData = this.floors[this.currentFloor];

        let roomKey = null;
        let counter = 0;
        while (floorData[`${type}_${counter}`]) counter++;

        for (const key in floorData) {
            if (!key.startsWith(type + '_')) continue;
            for (let r = minR; r <= maxR; r++) {
                for (let c = minC; c <= maxC; c++) {
                    if (this.isAdjacentTo(r, c, floorData[key].cells)) { roomKey = key; break; }
                }
                if (roomKey) break;
            }
            if (roomKey) break;
        }
        if (!roomKey) {
            roomKey = `${type}_${counter}`;
            floorData[roomKey] = { type, cells: [] };
        }

        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
                const cell = this.getCell(r, c);
                if (cell.classList.contains('occupied')) continue;
                const cellKey = `${r}_${c}`;
                if (!floorData[roomKey].cells.includes(cellKey)) floorData[roomKey].cells.push(cellKey);
                cell.classList.add('occupied');
                cell.style.background = color;
                cell.dataset.room = roomKey;
                cell.innerHTML = `<div class="cell-label">${this.ROOM_NAMES[type]}</div>`;
            }
        }
        this.updateRoomsList();
    },

    isAdjacentTo(r, c, cells) {
        return [`${r-1}_${c}`, `${r+1}_${c}`, `${r}_${c-1}`, `${r}_${c+1}`].some(n => cells.includes(n));
    },

    eraseCell(r, c) {
        const cell = this.getCell(r, c);
        if (!cell.classList.contains('occupied')) return;
        const roomKey = cell.dataset.room;
        const cellKey = `${r}_${c}`;
        const floorData = this.floors[this.currentFloor];
        if (floorData[roomKey]) {
            floorData[roomKey].cells = floorData[roomKey].cells.filter(ck => ck !== cellKey);
            if (floorData[roomKey].cells.length === 0) delete floorData[roomKey];
        }
        if (this.equips[this.currentFloor]) delete this.equips[this.currentFloor][cellKey];
        cell.classList.remove('occupied');
        cell.style.background = '';
        cell.innerHTML = '';
        delete cell.dataset.room;
        this.updateRoomsList();
    },

    // ===== ÉQUIPEMENTS (prises, interrupteurs) =====
    handleEquipClick(r, c) {
        const cell = this.getCell(r, c);
        if (!cell.classList.contains('occupied')) return;
        const cellKey = `${r}_${c}`;
        const floor = this.currentFloor;
        if (!this.equips[floor]) this.equips[floor] = {};
        if (this.currentEquip === 'erase-equip') {
            delete this.equips[floor][cellKey];
        } else {
            if (!this.equips[floor][cellKey]) this.equips[floor][cellKey] = [];
            this.equips[floor][cellKey].push({ type: this.currentEquip, icon: this.EQUIP_ICONS[this.currentEquip] });
        }
        this.renderCellEquips(r, c);
        this.updateRoomsList();
    },

    renderCellEquips(r, c) {
        const cell = this.getCell(r, c);
        const existing = cell.querySelector('.cell-equip');
        if (existing) existing.remove();
        const equipList = (this.equips[this.currentFloor] || {})[`${r}_${c}`] || [];
        if (equipList.length === 0) return;
        const div = document.createElement('div');
        div.className = 'cell-equip';
        div.innerHTML = equipList.map(eq => `<span class="equip-marker">${eq.icon}</span>`).join('');
        cell.appendChild(div);
    },

    // ===============================================
    // ===== EDGE OVERLAY (murs sur les lignes) =====
    // ===============================================
    showEdgeOverlay() {
        const container = document.getElementById('grid-edges');
        container.innerHTML = '';
        container.style.display = '';
        const step = this.CELL + this.GAP; // 43px
        const orient = this.wallOrient; // 'h', 'v', 'd'

        // Lignes horizontales
        if (orient === 'h' || orient === 'auto') {
            for (let r = 0; r <= this.ROWS; r++) {
                for (let c = 0; c < this.COLS; c++) {
                    this.addEdgeEl(container, `h_${r}_${c}`, 'edge-h', {
                        left: (c * step) + 'px',
                        top: (r * step - 4) + 'px',
                        width: this.CELL + 'px'
                    });
                }
            }
        }

        // Lignes verticales
        if (orient === 'v' || orient === 'auto') {
            for (let r = 0; r < this.ROWS; r++) {
                for (let c = 0; c <= this.COLS; c++) {
                    this.addEdgeEl(container, `v_${r}_${c}`, 'edge-v', {
                        left: (c * step - 4) + 'px',
                        top: (r * step) + 'px',
                        height: this.CELL + 'px'
                    });
                }
            }
        }

        // Diagonales
        if (orient === 'd') {
            const diagLen = Math.sqrt(this.CELL * this.CELL + this.CELL * this.CELL); // ~59px
            const angle = 45;
            for (let r = 0; r < this.ROWS; r++) {
                for (let c = 0; c < this.COLS; c++) {
                    // Diagonale \
                    this.addEdgeEl(container, `d1_${r}_${c}`, 'edge-d', {
                        left: (c * step) + 'px',
                        top: (r * step) + 'px',
                        height: diagLen + 'px',
                        transform: `rotate(${angle}deg)`
                    });
                    // Diagonale /
                    this.addEdgeEl(container, `d2_${r}_${c}`, 'edge-d', {
                        left: (c * step + this.CELL) + 'px',
                        top: (r * step) + 'px',
                        height: diagLen + 'px',
                        transform: `rotate(-${angle}deg)`
                    });
                }
            }
        }

        // Toujours afficher les murs/portes déjà posés (même si autre orientation)
        this.showExistingEdges(container, step);
    },

    // Show edges that have walls/doors but aren't in the current orientation filter
    showExistingEdges(container, step) {
        const floor = this.currentFloor;
        const doorObj = this.doors[floor] || {};
        // Fusionner murs + portes pour tout afficher
        const wallObj = { ...(this.walls[floor] || {}), ...doorObj };
        const orient = this.wallOrient;
        const diagLen = Math.sqrt(this.CELL * this.CELL + this.CELL * this.CELL);

        for (const key in wallObj) {
            const parts = key.split('_');
            const type = parts[0];
            // Skip if already shown by the orientation filter
            if (orient === 'h' && type === 'h') continue;
            if (orient === 'v' && type === 'v') continue;
            if (orient === 'd' && (type === 'd1' || type === 'd2')) continue;

            const r = parseInt(parts[1]);
            const c = parseInt(parts[2]);
            let cls, styles;

            if (type === 'h') {
                cls = 'edge-h';
                styles = { left: (c * step) + 'px', top: (r * step - 4) + 'px', width: this.CELL + 'px' };
            } else if (type === 'v') {
                cls = 'edge-v';
                styles = { left: (c * step - 4) + 'px', top: (r * step) + 'px', height: this.CELL + 'px' };
            } else if (type === 'd1') {
                cls = 'edge-d';
                styles = { left: (c * step) + 'px', top: (r * step) + 'px', height: diagLen + 'px', transform: 'rotate(45deg)' };
            } else if (type === 'd2') {
                cls = 'edge-d';
                styles = { left: (c * step + this.CELL) + 'px', top: (r * step) + 'px', height: diagLen + 'px', transform: 'rotate(-45deg)' };
            } else continue;

            // Only show as indicator (non-clickable)
            const el = document.createElement('div');
            el.className = `edge-line ${cls}`;
            Object.assign(el.style, styles);
            el.style.pointerEvents = 'none';
            el.style.opacity = '0.4';
            this.applyEdgeStyle(el, key);
            container.appendChild(el);
        }
    },

    isDrawingEdge: false,  // true quand on maintient le clic pour poser des murs en continu

    addEdgeEl(container, key, cls, styles) {
        const el = document.createElement('div');
        el.className = `edge-line ${cls}`;
        Object.assign(el.style, styles);
        el.dataset.key = key;
        this.applyEdgeStyle(el, key);
        // Hover preview
        el.addEventListener('mouseenter', () => {
            if (!el.classList.contains('has-wall') && !el.classList.contains('has-door') && !el.classList.contains('has-window')) {
                if (this.currentEquip === 'door') el.classList.add('door-preview');
                else if (this.currentEquip === 'wall') el.classList.add('wall-preview');
                else if (this.currentEquip === 'window') el.classList.add('window-preview');
            }
            // Drag continu : si le clic est maintenu, poser directement
            if (this.isDrawingEdge) {
                this.onEdgeConfirm(key, el);
            }
        });
        el.addEventListener('mouseleave', () => {
            el.classList.remove('door-preview', 'wall-preview', 'window-preview');
        });
        // Clic = place directement + active le mode drag
        el.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.isDrawingEdge = true;
            this.onEdgeConfirm(key, el);
        });
        container.appendChild(el);
    },

    // Overlay gomme : affiche uniquement les murs/portes existants (cliquables)
    showEraseOverlay() {
        const container = document.getElementById('grid-edges');
        container.innerHTML = '';
        container.style.display = '';
        const step = this.CELL + this.GAP;
        const floor = this.currentFloor;
        const wallObj = this.walls[floor] || {};
        const diagLen = Math.sqrt(this.CELL * this.CELL + this.CELL * this.CELL);

        for (const key in wallObj) {
            const parts = key.split('_');
            const type = parts[0];
            const r = parseInt(parts[1]);
            const c = parseInt(parts[2]);
            let cls, styles;

            if (type === 'h') {
                cls = 'edge-h';
                styles = { left: (c * step) + 'px', top: (r * step - 4) + 'px', width: this.CELL + 'px' };
            } else if (type === 'v') {
                cls = 'edge-v';
                styles = { left: (c * step - 4) + 'px', top: (r * step) + 'px', height: this.CELL + 'px' };
            } else if (type === 'd1') {
                cls = 'edge-d';
                styles = { left: (c * step) + 'px', top: (r * step) + 'px', height: diagLen + 'px', transform: 'rotate(45deg)' };
            } else if (type === 'd2') {
                cls = 'edge-d';
                styles = { left: (c * step + this.CELL) + 'px', top: (r * step) + 'px', height: diagLen + 'px', transform: 'rotate(-45deg)' };
            } else continue;

            this.addEdgeEl(container, key, cls, styles);
        }
    },

    hideEdgeOverlay() {
        const container = document.getElementById('grid-edges');
        if (container) { container.innerHTML = ''; container.style.display = 'none'; }
        const orientEl = document.getElementById('wall-orient');
        if (orientEl) orientEl.style.display = 'none';
    },

    applyEdgeStyle(el, key) {
        const floor = this.currentFloor;
        el.classList.remove('has-wall', 'has-door', 'has-window',
            'win-simple', 'win-double', 'win-baie', 'win-velux', 'win-oeil');
        const wtype = this.windows[floor]?.[key];
        if (wtype) {
            el.classList.add('has-window', 'win-' + wtype);
        } else if (this.doors[floor]?.[key]) {
            el.classList.add('has-door');
        } else if (this.walls[floor]?.[key]) {
            el.classList.add('has-wall');
        }
    },

    onEdgeConfirm(key, el) {
        const floor = this.currentFloor;
        if (!this.walls[floor]) this.walls[floor] = {};
        if (!this.doors[floor]) this.doors[floor] = {};
        if (!this.windows[floor]) this.windows[floor] = {};

        if (this.currentEquip === 'wall') {
            delete this.doors[floor][key];
            delete this.windows[floor][key];
            this.walls[floor][key] = true;
        } else if (this.currentEquip === 'door') {
            delete this.windows[floor][key];
            this.walls[floor][key] = true;
            this.doors[floor][key] = true;
        } else if (this.currentEquip === 'window') {
            delete this.doors[floor][key];
            this.walls[floor][key] = true;
            this.windows[floor][key] = this.windowType; // 'simple', 'double', 'baie', 'velux', 'oeil'
        } else if (this.currentEquip === 'erase-wall') {
            delete this.walls[floor][key];
            delete this.doors[floor][key];
            delete this.windows[floor][key];
            el.remove();
        }
        el.classList.remove('door-preview', 'wall-preview', 'window-preview');
        this.applyEdgeStyle(el, key);
        this.updateRoomsList();
    },

    // ===== FLOOR =====
    saveCurrentFloor() {},

    restoreFloor() {
        const floorData = this.floors[this.currentFloor] || {};
        for (const key in floorData) {
            const room = floorData[key];
            const color = this.ROOM_COLORS[room.type];
            const name = this.ROOM_NAMES[room.type];
            room.cells.forEach(cellKey => {
                const [r, c] = cellKey.split('_').map(Number);
                const cell = this.getCell(r, c);
                if (cell) {
                    cell.classList.add('occupied');
                    cell.style.background = color;
                    cell.dataset.room = key;
                    cell.innerHTML = `<div class="cell-label">${name}</div>`;
                    this.renderCellEquips(r, c);
                }
            });
        }
    },

    // ===== ROOMS LIST =====
    countRoomEquips(roomKey) {
        const room = (this.floors[this.currentFloor] || {})[roomKey];
        if (!room) return {};
        const equipFloor = this.equips[this.currentFloor] || {};
        const counts = {};
        room.cells.forEach(ck => {
            (equipFloor[ck] || []).forEach(eq => { counts[eq.type] = (counts[eq.type] || 0) + 1; });
        });
        return counts;
    },

    updateRoomsList() {
        const container = document.getElementById('rooms-list');
        const floorData = this.floors[this.currentFloor] || {};
        let html = '';
        for (const key in floorData) {
            const room = floorData[key];
            if (room.cells.length === 0) continue;
            const color = this.ROOM_COLORS[room.type];
            const name = this.ROOM_NAMES[room.type];
            const eq = this.countRoomEquips(key);
            let eqText = Object.entries(eq).map(([t, n]) => `${this.EQUIP_ICONS[t]} ×${n}`).join(' ');
            html += `<div class="room-tag">
                <span class="room-tag-color" style="background:${color}"></span> ${name}
                <span class="room-tag-count">${room.cells.length}m²${eqText ? ' — ' + eqText : ''}</span>
                <span class="room-tag-delete" onclick="Grid.deleteRoom('${key}')">×</span>
            </div>`;
        }
        const wc = Object.keys(this.walls[this.currentFloor] || {}).length;
        const dc = Object.keys(this.doors[this.currentFloor] || {}).length;
        const wnc = Object.keys(this.windows[this.currentFloor] || {}).length;
        if (wc > 0) {
            let info = `${wc} murs`;
            if (dc > 0) info += ` / ${dc} portes`;
            if (wnc > 0) info += ` / ${wnc} fenêtres`;
            html += `<div class="room-tag"><span class="room-tag-color" style="background:#fff"></span> ${info}</div>`;
        }
        container.innerHTML = html;
    },

    deleteRoom(key) {
        const floorData = this.floors[this.currentFloor];
        if (!floorData[key]) return;
        floorData[key].cells.forEach(cellKey => {
            const [r, c] = cellKey.split('_').map(Number);
            const cell = this.getCell(r, c);
            if (cell) { cell.classList.remove('occupied'); cell.style.background = ''; cell.innerHTML = ''; delete cell.dataset.room; }
            if (this.equips[this.currentFloor]) delete this.equips[this.currentFloor][cellKey];
        });
        delete floorData[key];
        this.updateRoomsList();
    },

    getAllEquipsForFloor(floorIdx) {
        const ef = this.equips[floorIdx] || {};
        const r = [];
        for (const ck in ef) ef[ck].forEach(eq => r.push({ cell: ck, ...eq }));
        return r;
    },

    // ===== VIEWS =====
    currentView: '2d',

    setView(mode, btn) {
        this.currentView = mode;
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.getElementById('grid-container').style.display = 'none';
        document.getElementById('coupe-container').style.display = 'none';
        document.getElementById('three-container').style.display = 'none';
        const fs = document.getElementById('floor-selector');
        if (fs) fs.style.display = 'none';

        if (mode === '2d') {
            document.getElementById('grid-container').style.display = '';
            if (fs) fs.style.display = '';
            View3D.dispose();
        } else if (mode === 'coupe') {
            document.getElementById('coupe-container').style.display = '';
            View3D.dispose();
            this.renderCoupe();
        } else if (mode === '3d') {
            document.getElementById('three-container').style.display = '';
            View3D.init();
        }
    },

    renderCoupe() {
        const container = document.getElementById('coupe-container');
        const etages = projet.etages || [{ nom: 'RDC', numero: 0 }];
        let html = '<div class="coupe-wrapper">';
        for (let fi = etages.length - 1; fi >= 0; fi--) {
            const fd = this.floors[fi] || {};
            const ef = this.equips[fi] || {};
            html += `<div class="coupe-floor"><div class="coupe-floor-label">${etages[fi]?.nom || 'Étage ' + fi}</div>`;
            html += `<div class="coupe-grid" style="grid-template-columns:repeat(${this.COLS},28px);grid-template-rows:repeat(${this.ROWS},28px);">`;
            for (let r = 0; r < this.ROWS; r++) {
                for (let c = 0; c < this.COLS; c++) {
                    const ck = `${r}_${c}`;
                    let cls = 'coupe-cell', sty = '', inner = '';
                    for (const k in fd) {
                        if (fd[k].cells.includes(ck)) {
                            cls += ' occupied';
                            sty = `background:${this.ROOM_COLORS[fd[k].type]};`;
                            inner = `<div class="cell-label">${this.ROOM_NAMES[fd[k].type] || ''}</div>`;
                            break;
                        }
                    }
                    const eqs = ef[ck] || [];
                    if (eqs.length) inner += `<div class="cell-equip">${eqs.map(eq => `<span class="equip-marker">${eq.icon}</span>`).join('')}</div>`;
                    html += `<div class="${cls}" style="${sty}">${inner}</div>`;
                }
            }
            html += '</div></div>';
            if (fi > 0) html += `<div class="coupe-separator" style="width:${this.COLS * 29}px"></div>`;
        }
        html += '</div>';
        container.innerHTML = html;
    }
};
