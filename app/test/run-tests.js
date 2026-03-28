// ===== Tests automatiques grid.js (Node.js) =====
function mockEl() {
    return {
        className: '', style: {}, dataset: {}, innerHTML: '',
        children: [],
        classList: {
            _cls: new Set(),
            add(...c) { c.forEach(x => this._cls.add(x)); },
            remove(...c) { c.forEach(x => this._cls.delete(x)); },
            toggle(c, f) { if (f) this._cls.add(c); else this._cls.delete(c); },
            contains(c) { return this._cls.has(c); }
        },
        addEventListener() {},
        appendChild(child) { this.children.push(child); return child; },
        remove() {},
        querySelectorAll(sel) {
            return this.children.filter(c => {
                if (sel.includes('[data-key]')) return c.dataset && c.dataset.key;
                if (sel.includes('.orient-btn')) return c.className.includes('orient-btn');
                if (sel.includes('.edge-h')) return c.className.includes('edge-h');
                if (sel.includes('.edge-v')) return c.className.includes('edge-v');
                if (sel.includes('.edge-d')) return c.className.includes('edge-d');
                return false;
            });
        },
        querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
    };
}

const edgesCont = mockEl();
const orientCont = mockEl();
['h', 'v', 'd'].forEach(o => {
    const b = mockEl();
    b.className = 'orient-btn';
    b.dataset = { orient: o };
    orientCont.children.push(b);
});

global.document = {
    getElementById(id) {
        if (id === 'grid-edges') return edgesCont;
        if (id === 'wall-orient') return orientCont;
        return mockEl();
    },
    querySelectorAll() { return []; },
    querySelector() { return null; },
    createElement() { return mockEl(); },
    addEventListener() {}
};
global.window = { addEventListener() {} };
global.THREE = { Vector2: function() { this.x = 0; this.y = 0; }, Color: function() {}, MOUSE: { ROTATE: 0, DOLLY: 1, PAN: 2 } };
global.projet = { etages: [{ nom: 'RDC', numero: 0 }], appareils: {} };

const code = require('fs').readFileSync(__dirname + '/../js/grid.js', 'utf8');
const Grid = new Function(code + '; return Grid;')();

let pass = 0, fail = 0;
function assert(name, cond) {
    if (cond) { pass++; console.log('  OK ' + name); }
    else { fail++; console.log('  FAIL: ' + name); }
}

// ── wallOrient ──
console.log('-- wallOrient --');
assert('Default = h', Grid.wallOrient === 'h');
Grid.setWallOrient('v', null);
assert('set v', Grid.wallOrient === 'v');
Grid.setWallOrient('d', null);
assert('set d', Grid.wallOrient === 'd');
Grid.setWallOrient('h', null);
assert('reset h', Grid.wallOrient === 'h');

// ── Data Model ──
console.log('-- Data Model --');
Grid.floors[0] = { salon_0: { type: 'salon', cells: ['1_1', '1_2'] } };
Grid.walls[0] = { 'h_1_1': true, 'v_1_1': true, 'd1_2_2': true };
Grid.doors[0] = { 'h_1_1': true };
Grid.equips[0] = { '1_1': [{ type: 'prise', icon: 'x' }] };
assert('salon exists', !!Grid.floors[0].salon_0);
assert('h wall', !!Grid.walls[0]['h_1_1']);
assert('v wall', !!Grid.walls[0]['v_1_1']);
assert('d1 wall', !!Grid.walls[0]['d1_2_2']);
assert('door', !!Grid.doors[0]['h_1_1']);
assert('equip', Grid.equips[0]['1_1'][0].type === 'prise');

// ── isAdjacentTo ──
console.log('-- isAdjacentTo --');
assert('adj 1,1->1_2', Grid.isAdjacentTo(1, 1, ['1_2']));
assert('adj 1,1->0_1', Grid.isAdjacentTo(1, 1, ['0_1']));
assert('not adj 1,1->3_3', !Grid.isAdjacentTo(1, 1, ['3_3']));

// ── selectEquip(wall-h) ──
console.log('-- selectEquip(wall-h) --');
const fakeWallH = { dataset: { equip: 'wall-h' }, classList: { add() {}, remove() {} } };
Grid.selectEquip(fakeWallH);
assert('currentEquip=wall', Grid.currentEquip === 'wall');
assert('currentType=null', Grid.currentType === null);
assert('wallOrient=h', Grid.wallOrient === 'h');
assert('orient hidden', orientCont.style.display === 'none');

// ── selectEquip(wall-v) ──
console.log('-- selectEquip(wall-v) --');
const fakeWallV = { dataset: { equip: 'wall-v' }, classList: { add() {}, remove() {} } };
Grid.selectEquip(fakeWallV);
assert('currentEquip=wall', Grid.currentEquip === 'wall');
assert('wallOrient=v', Grid.wallOrient === 'v');

// ── selectEquip(door) ──
console.log('-- selectEquip(door) --');
Grid.selectEquip({ dataset: { equip: 'door' }, classList: { add() {}, remove() {} } });
assert('currentEquip=door', Grid.currentEquip === 'door');
assert('wallOrient=h', Grid.wallOrient === 'h');
assert('orient visible', orientCont.style.display !== 'none');

// ── selectEquip(erase-wall) ──
console.log('-- selectEquip(erase-wall) --');
Grid.selectEquip({ dataset: { equip: 'erase-wall' }, classList: { add() {}, remove() {} } });
assert('currentEquip=erase-wall', Grid.currentEquip === 'erase-wall');
assert('orient hidden', orientCont.style.display === 'none');

// ── selectEquip(prise) ──
console.log('-- selectEquip(prise) --');
Grid.selectEquip({ dataset: { equip: 'prise' }, classList: { add() {}, remove() {} } });
assert('currentEquip=prise', Grid.currentEquip === 'prise');

// ── Edge Overlay H ──
console.log('-- Edge Overlay H --');
Grid.selectEquip({ dataset: { equip: 'wall-h' }, classList: { add() {}, remove() {} } });
edgesCont.children = [];
Grid.showEdgeOverlay();
const hEdges = edgesCont.children.filter(c => c.className.includes('edge-h') && c.dataset.key);
const vEdgesClickable = edgesCont.children.filter(c => c.className.includes('edge-v') && c.dataset.key);
assert('H mode: h edges > 0 (' + hEdges.length + ')', hEdges.length > 0);
assert('H mode: v clickable = 0', vEdgesClickable.length === 0);

// ── Edge Overlay V ──
console.log('-- Edge Overlay V --');
edgesCont.children = [];
Grid.setWallOrient('v', null);
Grid.showEdgeOverlay();
const vE = edgesCont.children.filter(c => c.className.includes('edge-v') && c.dataset.key);
const hE = edgesCont.children.filter(c => c.className.includes('edge-h') && c.dataset.key);
assert('V mode: v edges > 0 (' + vE.length + ')', vE.length > 0);
assert('V mode: h clickable = 0', hE.length === 0);

// ── Edge Overlay D ──
console.log('-- Edge Overlay D --');
edgesCont.children = [];
Grid.setWallOrient('d', null);
Grid.showEdgeOverlay();
const dE = edgesCont.children.filter(c => c.className.includes('edge-d') && c.dataset.key);
assert('D mode: d edges > 0 (' + dE.length + ')', dE.length > 0);

// ── onEdgeConfirm ──
console.log('-- onEdgeConfirm --');
Grid.currentFloor = 0;
Grid.currentEquip = 'wall';
Grid.walls[0] = {};
Grid.doors[0] = {};
const fakeEdgeEl = mockEl();
Grid.onEdgeConfirm('h_5_5', fakeEdgeEl);
assert('Wall h_5_5 placed', !!Grid.walls[0]['h_5_5']);
assert('No door h_5_5', !Grid.doors[0]['h_5_5']);

Grid.currentEquip = 'door';
Grid.onEdgeConfirm('v_3_3', fakeEdgeEl);
assert('Wall v_3_3 placed (door=wall)', !!Grid.walls[0]['v_3_3']);
assert('Door v_3_3 placed', !!Grid.doors[0]['v_3_3']);

Grid.currentEquip = 'window';
Grid.onEdgeConfirm('h_6_6', fakeEdgeEl);
assert('Window h_6_6: wall placed', !!Grid.walls[0]['h_6_6']);
assert('Window h_6_6: window placed', !!Grid.windows[0]['h_6_6']);
assert('Window h_6_6: no door', !Grid.doors[0]['h_6_6']);

Grid.currentEquip = 'erase-wall';
Grid.onEdgeConfirm('h_5_5', fakeEdgeEl);
assert('Wall h_5_5 erased', !Grid.walls[0]['h_5_5']);
Grid.onEdgeConfirm('h_6_6', fakeEdgeEl);
assert('Window h_6_6 erased (wall)', !Grid.walls[0]['h_6_6']);
assert('Window h_6_6 erased (window)', !Grid.windows[0]['h_6_6']);

// ── selectEquip(window) ──
console.log('-- selectEquip(window) --');
Grid.selectEquip({ dataset: { equip: 'window' }, classList: { add() {}, remove() {} } });
assert('currentEquip=window', Grid.currentEquip === 'window');
assert('orient visible', orientCont.style.display !== 'none');
assert('wallOrient=h', Grid.wallOrient === 'h');

// ── getAllEquipsForFloor ──
console.log('-- getAllEquipsForFloor --');
Grid.equips[0] = { '1_1': [{ type: 'prise', icon: 'x' }], '2_2': [{ type: 'double', icon: 'xx' }] };
assert('2 equips floor 0', Grid.getAllEquipsForFloor(0).length === 2);

// ── countRoomEquips ──
console.log('-- countRoomEquips --');
Grid.floors[0] = { salon_0: { type: 'salon', cells: ['1_1', '1_2'] } };
Grid.currentFloor = 0;
const cnt = Grid.countRoomEquips('salon_0');
assert('prise=1', cnt.prise === 1);

// ── SUMMARY ──
console.log('');
console.log('========================================');
console.log('RESULTAT: ' + pass + ' PASS / ' + fail + ' FAIL / ' + (pass + fail) + ' TOTAL');
if (fail === 0) console.log('Tous les tests passent !');
else {
    console.log('Des tests ont echoue !');
}
console.log('========================================');
process.exit(fail > 0 ? 1 : 0);
