// ===== DONNÉES DU PROJET =====
const projet = {
    nom: '',
    type: '',       // 'maison' ou 'appartement'
    etages: [],     // [{nom: 'RDC', numero: 0}, ...]
    pieces: {},     // par étage : { 0: [{id, type, nom, cells:[...]}], ... }
    appareils: {}   // par pièce id : [{nom, watts, icone}, ...]
};

let currentStep = 1;
let nbEtages = 1;
let nbPieces = 3;

// Catalogue d'appareils avec puissances moyennes
const CATALOGUE = [
    { nom: 'Prise murale',   watts: 0,    icone: '🔌' },
    { nom: 'Plafonnier',     watts: 60,   icone: '💡' },
    { nom: 'Lampe',          watts: 40,   icone: '🛋' },
    { nom: 'Radiateur',      watts: 1500, icone: '🔥' },
    { nom: 'Chauffe-eau',    watts: 2000, icone: '🚿' },
    { nom: 'Four',           watts: 2500, icone: '🍕' },
    { nom: 'Plaque cuisson', watts: 3000, icone: '🍳' },
    { nom: 'Réfrigérateur',  watts: 150,  icone: '🧊' },
    { nom: 'Lave-linge',     watts: 2200, icone: '👕' },
    { nom: 'Lave-vaisselle', watts: 1800, icone: '🍽' },
    { nom: 'Sèche-linge',   watts: 2500, icone: '🌀' },
    { nom: 'TV',             watts: 100,  icone: '📺' },
    { nom: 'Ordinateur',     watts: 300,  icone: '💻' },
    { nom: 'VMC',            watts: 30,   icone: '🌬' },
    { nom: 'Chaudière',      watts: 200,  icone: '♨' },
    { nom: 'Climatisation',  watts: 2000, icone: '❄' },
    { nom: 'Volet roulant',  watts: 200,  icone: '🪟' },
];

// ===== NAVIGATION =====
const App = {
    goStep(n) {
        // Validation
        if (n === 2 && currentStep === 1) {
            const nom = document.getElementById('projet-nom').value.trim();
            if (!nom) { document.getElementById('projet-nom').focus(); return; }
            projet.nom = nom;
        }
        if (n === 4 && currentStep === 3) {
            this.buildEtagesData();
        }
        if (n === 5 && currentStep === 4) {
            this.buildPiecesFromGrid();
            if (Object.keys(projet.pieces).length === 0 || this.countTotalRooms() === 0) {
                alert('Dessinez au moins une pièce sur la grille !');
                return;
            }
            this.buildAppareilsUI();
        }

        // Switch
        document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
        const target = document.querySelector(`.step[data-step="${n}"]`);
        if (target) target.classList.add('active');

        // Progress
        document.querySelectorAll('.progress-step').forEach(ps => {
            const sn = parseInt(ps.dataset.pstep);
            ps.classList.remove('done', 'current');
            if (sn < n) ps.classList.add('done');
            if (sn === n) ps.classList.add('current');
        });

        currentStep = n;

        // Init step-specific
        if (n === 3) this.initStep3();
        if (n === 4) this.initStep4();
    },

    // === TYPE ===
    setType(type) {
        projet.type = type;
        document.querySelectorAll('.type-card').forEach(c => c.classList.remove('selected'));
        event.currentTarget.classList.add('selected');
        setTimeout(() => this.goStep(3), 300);
    },

    // === STEP 3 : Config ===
    initStep3() {
        if (projet.type === 'maison') {
            document.getElementById('config-maison').style.display = 'block';
            document.getElementById('config-appart').style.display = 'none';
            document.getElementById('titre-step3').textContent = 'Configuration de la maison';
            this.renderEtages();
        } else {
            document.getElementById('config-maison').style.display = 'none';
            document.getElementById('config-appart').style.display = 'block';
            document.getElementById('titre-step3').textContent = "Configuration de l'appartement";
        }
    },

    adjustEtages(delta) {
        nbEtages = Math.max(1, Math.min(10, nbEtages + delta));
        document.getElementById('nb-etages').textContent = nbEtages;
        this.renderEtages();
    },

    adjustPieces(delta) {
        nbPieces = Math.max(1, Math.min(20, nbPieces + delta));
        document.getElementById('nb-pieces').textContent = nbPieces;
    },

    renderEtages() {
        const container = document.getElementById('etages-liste');
        const defaults = ['Sous-sol', 'RDC', 'R+1', 'R+2', 'R+3', 'R+4', 'R+5', 'R+6', 'R+7', 'R+8'];
        let html = '';
        for (let i = 0; i < nbEtages; i++) {
            const def = defaults[i] || `Étage ${i}`;
            const existing = projet.etages[i]?.nom || def;
            html += `<div class="etage-row">
                <label>Étage ${i + 1} :</label>
                <input type="text" class="etage-name" value="${existing}" placeholder="${def}">
            </div>`;
        }
        container.innerHTML = html;
    },

    buildEtagesData() {
        projet.etages = [];
        if (projet.type === 'maison') {
            document.querySelectorAll('.etage-name').forEach((input, i) => {
                projet.etages.push({ nom: input.value.trim() || `Étage ${i}`, numero: i });
            });
        } else {
            projet.etages = [{ nom: 'Appartement', numero: 0 }];
        }
    },

    // === STEP 4 : Grid ===
    initStep4() {
        this.buildFloorSelector();
        Grid.init(0);
    },

    buildFloorSelector() {
        const container = document.getElementById('floor-selector');
        if (projet.etages.length <= 1) {
            container.innerHTML = '';
            return;
        }
        container.innerHTML = projet.etages.map((e, i) =>
            `<div class="floor-tab ${i === 0 ? 'active' : ''}" onclick="App.switchFloor(${i})">${e.nom}</div>`
        ).join('');
    },

    switchFloor(index) {
        document.querySelectorAll('.floor-tab').forEach((t, i) => {
            t.classList.toggle('active', i === index);
        });
        Grid.saveCurrentFloor();
        Grid.init(index);
    },

    buildPiecesFromGrid() {
        Grid.saveCurrentFloor();
    },

    countTotalRooms() {
        let count = 0;
        for (const floor in Grid.floors) {
            const rooms = Grid.floors[floor];
            for (const key in rooms) {
                if (rooms[key].cells && rooms[key].cells.length > 0) count++;
            }
        }
        return count;
    },

    // === STEP 5 : Appareils ===
    buildAppareilsUI() {
        const container = document.getElementById('appareils-container');
        let html = '';
        let roomIndex = 0;

        for (const floorIdx in Grid.floors) {
            const floorRooms = Grid.floors[floorIdx];
            const etageNom = projet.etages[floorIdx]?.nom || `Étage ${floorIdx}`;

            for (const key in floorRooms) {
                const room = floorRooms[key];
                if (!room.cells || room.cells.length === 0) continue;

                const roomId = `room_${floorIdx}_${key}`;
                const color = Grid.ROOM_COLORS[room.type] || '#888';
                const typeName = Grid.ROOM_NAMES[room.type] || room.type;
                const label = `${typeName} — ${etageNom}`;

                if (!projet.appareils[roomId]) projet.appareils[roomId] = [];

                html += `<div class="piece-appareils" data-room="${roomId}">
                    <div class="piece-appareils-header" onclick="App.toggleAppareils(this)">
                        <h3><span class="pa-color" style="background:${color}"></span>${label}</h3>
                        <span class="pa-count">${projet.appareils[roomId].length} appareils</span>
                    </div>
                    <div class="piece-appareils-body">
                        <div class="appareil-catalogue">
                            ${CATALOGUE.map((a, i) =>
                                `<button class="appareil-btn" onclick="App.addAppareil('${roomId}', ${i})">${a.icone} ${a.nom}</button>`
                            ).join('')}
                        </div>
                        <ul class="appareil-list" id="list-${roomId}">
                            ${this.renderAppareils(roomId)}
                        </ul>
                    </div>
                </div>`;
                roomIndex++;
            }
        }
        container.innerHTML = html;
    },

    toggleAppareils(header) {
        const body = header.nextElementSibling;
        body.classList.toggle('open');
    },

    addAppareil(roomId, catalogueIndex) {
        const item = { ...CATALOGUE[catalogueIndex] };
        projet.appareils[roomId].push(item);
        document.getElementById(`list-${roomId}`).innerHTML = this.renderAppareils(roomId);
        // Update count
        const card = document.querySelector(`.piece-appareils[data-room="${roomId}"]`);
        card.querySelector('.pa-count').textContent = `${projet.appareils[roomId].length} appareils`;
    },

    removeAppareil(roomId, index) {
        projet.appareils[roomId].splice(index, 1);
        document.getElementById(`list-${roomId}`).innerHTML = this.renderAppareils(roomId);
        const card = document.querySelector(`.piece-appareils[data-room="${roomId}"]`);
        card.querySelector('.pa-count').textContent = `${projet.appareils[roomId].length} appareils`;
    },

    renderAppareils(roomId) {
        return (projet.appareils[roomId] || []).map((a, i) =>
            `<li>
                <div class="appareil-info">
                    <span>${a.icone} ${a.nom}</span>
                    <span class="appareil-watts">${a.watts > 0 ? a.watts + 'W' : '—'}</span>
                </div>
                <span class="appareil-remove" onclick="App.removeAppareil('${roomId}', ${i})">×</span>
            </li>`
        ).join('');
    },

    // === STEP 6 : Rapport ===
    generateReport() {
        document.getElementById('rapport-titre').textContent = `Rapport — ${projet.nom}`;

        let totalWatts = 0;
        let totalAppareils = 0;
        let totalPieces = 0;

        // Count
        for (const roomId in projet.appareils) {
            totalAppareils += projet.appareils[roomId].length;
            projet.appareils[roomId].forEach(a => totalWatts += a.watts);
        }
        totalPieces = this.countTotalRooms();

        let html = '';

        // Summary
        html += `<div class="rapport-summary">
            <div class="summary-card"><div class="val">${projet.type === 'maison' ? '🏠' : '🏢'}</div><div class="label">${projet.type}</div></div>
            <div class="summary-card"><div class="val">${projet.etages.length}</div><div class="label">Étage(s)</div></div>
            <div class="summary-card"><div class="val">${totalPieces}</div><div class="label">Pièce(s)</div></div>
            <div class="summary-card"><div class="val">${totalAppareils}</div><div class="label">Appareils</div></div>
            <div class="summary-card"><div class="val">${(totalWatts / 1000).toFixed(1)} kW</div><div class="label">Puissance totale</div></div>
            <div class="summary-card"><div class="val">${Math.ceil(totalWatts / 230)}A</div><div class="label">Ampérage estimé</div></div>
        </div>`;

        // Tree view
        html += `<h2>Arborescence</h2><div class="rapport-tree">`;
        html += `${projet.nom}\n`;
        projet.etages.forEach((etage, ei) => {
            const isLast = ei === projet.etages.length - 1;
            const prefix = isLast ? '└── ' : '├── ';
            const childPrefix = isLast ? '    ' : '│   ';
            html += `${prefix}${etage.nom}\n`;

            const floorRooms = Grid.floors[ei] || {};
            const roomKeys = Object.keys(floorRooms).filter(k => floorRooms[k].cells?.length > 0);
            roomKeys.forEach((key, ri) => {
                const room = floorRooms[key];
                const roomIsLast = ri === roomKeys.length - 1;
                const rPrefix = roomIsLast ? '└── ' : '├── ';
                const rChildPrefix = roomIsLast ? '    ' : '│   ';
                const typeName = Grid.ROOM_NAMES[room.type] || room.type;
                html += `${childPrefix}${rPrefix}${typeName} (${room.cells.length}m²)\n`;

                const roomId = `room_${ei}_${key}`;
                const appareils = projet.appareils[roomId] || [];
                appareils.forEach((a, ai) => {
                    const aIsLast = ai === appareils.length - 1;
                    const aPrefix = aIsLast ? '└── ' : '├── ';
                    html += `${childPrefix}${rChildPrefix}${aPrefix}${a.icone} ${a.nom} ${a.watts > 0 ? `(${a.watts}W)` : ''}\n`;
                });
            });
        });
        html += `</div>`;

        // Table par étage
        html += `<h2>Détail par pièce</h2>`;
        projet.etages.forEach((etage, ei) => {
            const floorRooms = Grid.floors[ei] || {};
            const roomKeys = Object.keys(floorRooms).filter(k => floorRooms[k].cells?.length > 0);
            if (roomKeys.length === 0) return;

            html += `<h3 style="margin:12px 0 6px;color:#888">${etage.nom}</h3>`;
            html += `<table><tr><th>Pièce</th><th>Surface</th><th>Appareils</th><th>Puissance</th></tr>`;
            roomKeys.forEach(key => {
                const room = floorRooms[key];
                const roomId = `room_${ei}_${key}`;
                const appareils = projet.appareils[roomId] || [];
                const watts = appareils.reduce((s, a) => s + a.watts, 0);
                const typeName = Grid.ROOM_NAMES[room.type] || room.type;
                html += `<tr>
                    <td>${typeName}</td>
                    <td>${room.cells.length} m²</td>
                    <td>${appareils.length}</td>
                    <td>${watts}W</td>
                </tr>`;
            });
            html += `</table>`;
        });

        document.getElementById('rapport-content').innerHTML = html;
        this.goStep(6);
    },

    exportPDF() {
        window.print();
    }
};
