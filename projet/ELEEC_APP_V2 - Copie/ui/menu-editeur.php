<style>
    /* Boussole 3D */
    #boussole {
        position: fixed;
        top: 50px;
        right: 20px;
        width: 120px;
        height: 120px;
        z-index: 10;
        pointer-events: auto;
    }
    #boussole canvas {
        cursor: pointer;
    }

    #toolbar {
        position: fixed;
        top: 15px;
        left: 15px;
        display: flex;
        gap: 6px;
        z-index: 10;
        transition: all 0.2s;
    }
    /* Mode texte : toolbar verticale a gauche */
    #toolbar.mode-texte {
        flex-direction: column;
        gap: 2px;
        max-height: 90vh;
        overflow-y: auto;
        overflow-x: hidden;
    }
    #toolbar.mode-texte .tool-sep {
        width: 100%;
        height: 1px;
        margin: 2px 0;
    }
    #toolbar.mode-texte .tool-btn {
        width: auto;
        height: auto;
        min-width: 130px;
        padding: 4px 10px;
        flex-direction: row;
        gap: 8px;
        justify-content: flex-start;
    }
    #toolbar.mode-texte .tool-btn svg {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
    }
    #toolbar.mode-texte .tool-btn .tool-label {
        display: inline;
        font-family: monospace;
        font-size: 11px;
        color: #ccc;
        white-space: nowrap;
    }
    /* Mode icone : labels caches */
    #toolbar:not(.mode-texte) .tool-label {
        display: none;
    }
    .tool-btn {
        width: 44px;
        height: 44px;
        border: 2px solid #333;
        border-radius: 8px;
        background: rgba(26, 26, 46, 0.85);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s;
        position: relative;
    }
    .tool-btn:hover {
        border-color: #888;
        background: rgba(26, 26, 46, 1);
    }
    .tool-btn.actif {
        border-color: #fff;
        box-shadow: 0 0 10px rgba(255,255,255,0.3);
    }
    .tool-btn svg {
        width: 26px;
        height: 26px;
    }
    .tool-sep {
        width: 1px;
        background: #333;
        margin: 6px 2px;
    }

    /* Categories toolbar */
    .tool-cat {
        position: relative;
    }
    .tool-cat-btn {
        width: 44px;
        height: 44px;
        border: 2px solid #333;
        border-radius: 8px;
        background: rgba(26, 26, 46, 0.85);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 1px;
        transition: all 0.15s;
        position: relative;
    }
    .tool-cat-btn:hover { border-color: #888; background: rgba(26, 26, 46, 1); }
    .tool-cat-btn.cat-ouvert { border-color: #fff; box-shadow: 0 0 8px rgba(255,255,255,0.2); }
    .tool-cat-btn.cat-actif { border-color: #4a9eff; box-shadow: 0 0 6px rgba(74,158,255,0.3); }
    .tool-cat-btn.cat-actif .cat-label { color: #4a9eff; }
    .tool-cat-btn svg { width: 22px; height: 22px; }
    .tool-cat-btn .cat-label { font-family: monospace; font-size: 8px; color: #888; line-height: 1; }
    .tool-cat-btn .cat-label-big { display: none; }
    #toolbar.mode-texte .tool-cat-btn {
        width: auto; height: auto; min-width: 130px; padding: 4px 10px;
        flex-direction: row; gap: 8px; justify-content: flex-start;
    }
    #toolbar.mode-texte .tool-cat-btn svg { width: 18px; height: 18px; flex-shrink: 0; }
    #toolbar.mode-texte .tool-cat-btn .cat-label { display: none; }
    #toolbar.mode-texte .tool-cat-btn .cat-label-big { display: inline; font-family: monospace; font-size: 11px; color: #ccc; white-space: nowrap; }

    .tool-cat-panel {
        display: none;
        position: fixed;
        top: 68px;
        background: rgba(20, 20, 40, 0.97);
        border: 1px solid #555;
        border-radius: 10px;
        padding: 6px;
        z-index: 15;
        gap: 4px;
        flex-wrap: wrap;
        max-width: 320px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    }
    .tool-cat-panel.ouvert { display: flex; }
    #toolbar.mode-texte .tool-cat-panel {
        position: relative;
        top: auto;
        background: none;
        border: none;
        border-left: 2px solid #444;
        margin-left: 8px;
        padding: 2px 0 2px 6px;
        box-shadow: none;
        flex-direction: column;
        max-width: none;
    }

    /* Sous-menu directions */
    #dir-menu {
        display: none;
        position: fixed;
        top: 68px;
        left: 15px;
        background: rgba(26, 26, 46, 0.95);
        border: 1px solid #333;
        border-radius: 8px;
        padding: 6px;
        z-index: 11;
    }
    #dir-menu .dir-grid {
        display: grid;
        grid-template-columns: 44px 44px 44px 44px 44px;
        grid-template-rows: 44px 44px 44px;
        gap: 4px;
    }
    #dir-menu .dir-btn {
        width: 44px;
        height: 44px;
        border: 2px solid #333;
        border-radius: 6px;
        background: rgba(22, 33, 62, 0.9);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s;
    }
    #dir-menu .dir-btn:hover {
        border-color: #43B047;
        background: rgba(22, 33, 62, 1);
    }
    #dir-menu .dir-btn.actif {
        border-color: #fff;
        box-shadow: 0 0 8px rgba(255,255,255,0.3);
    }
    #dir-menu .dir-btn svg {
        width: 24px;
        height: 24px;
    }
    #dir-menu .dir-vide {
        visibility: hidden;
    }

    #info-bar {
        position: fixed;
        bottom: 10px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.6);
        color: #aaa;
        padding: 6px 16px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 12px;
        z-index: 10;
        white-space: nowrap;
    }
    #canvas-container {
        width: 100vw;
        height: 100vh;
    }
    .popup {
        display: none;
        position: fixed;
        top: 70px;
        left: 15px;
        background: rgba(26, 26, 46, 0.95);
        color: #fff;
        font-family: monospace;
        font-size: 12px;
        padding: 12px;
        border-radius: 8px;
        border: 1px solid #333;
        z-index: 10;
        width: 220px;
    }
    .popup label {
        display: block;
        margin: 5px 0 2px 0;
        color: #aaa;
    }
    .popup input, .popup select {
        width: 100%;
        padding: 4px 6px;
        background: #16213e;
        color: #fff;
        border: 1px solid #333;
        border-radius: 3px;
        font-family: monospace;
        font-size: 11px;
    }
    .popup input[type="color"] {
        height: 25px;
        padding: 1px;
        cursor: pointer;
    }
    .popup-row {
        display: flex;
        gap: 6px;
    }
    .popup-row > div { flex: 1; }
    .popup-title {
        font-weight: bold;
        margin-bottom: 6px;
        display: block;
    }
    #mesures-panel {
        display: none;
        position: fixed;
        top: 70px;
        right: 15px;
        background: rgba(26, 26, 46, 0.95);
        border: 1px solid #00ccff;
        border-radius: 8px;
        padding: 10px;
        z-index: 10;
        width: 240px;
        font-family: monospace;
        font-size: 11px;
        color: #fff;
        max-height: 50vh;
        overflow-y: auto;
    }
    #mesures-panel .mesure-title {
        color: #00ccff;
        font-weight: bold;
        font-size: 12px;
        margin-bottom: 6px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .mesure-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 6px;
        border-radius: 4px;
        margin-bottom: 3px;
        background: rgba(0,204,255,0.08);
    }
    .mesure-item:hover {
        background: rgba(0,204,255,0.2);
    }
    .mesure-item .mesure-txt {
        flex: 1;
        cursor: pointer;
    }
    .mesure-item .mesure-del {
        cursor: pointer;
        color: #e94560;
        font-size: 14px;
        margin-left: 8px;
        font-weight: bold;
    }
    .mesure-item .mesure-del:hover {
        color: #ff6b81;
    }
    #selection-rect {
        display: none;
        position: fixed;
        border: 2px dashed #e94560;
        background: rgba(233, 69, 96, 0.1);
        z-index: 15;
        pointer-events: none;
    }
    #ctx-menu {
        display: none;
        position: fixed;
        background: rgba(26, 26, 46, 0.95);
        border: 1px solid #555;
        border-radius: 8px;
        padding: 4px 0;
        z-index: 20;
        min-width: 160px;
        font-family: monospace;
        font-size: 12px;
    }
    .ctx-item {
        padding: 8px 14px;
        color: #fff;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .ctx-item:hover {
        background: rgba(255,255,255,0.1);
    }
    .ctx-item .ctx-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
    }
    .ctx-sep {
        height: 1px;
        background: #333;
        margin: 4px 0;
    }
    .ctx-sub-parent {
        position: relative;
    }
    .ctx-submenu {
        display: none;
        position: absolute;
        left: 100%;
        top: -4px;
        background: rgba(26,26,46,0.95);
        border: 1px solid #444;
        border-radius: 8px;
        padding: 4px 0;
        min-width: 160px;
        z-index: 25;
    }
    .ctx-sub-parent:hover > .ctx-submenu {
        display: block;
    }
</style>

<div id="selection-rect"></div>

<!-- Menu contextuel mur -->
<div id="ctx-menu">
    <div class="ctx-item" id="ctx-editer"><span class="ctx-dot" style="background:#ffa500;"></span> Editer</div>
    <div class="ctx-item ctx-sub-parent" id="ctx-deplacer-menu"><span class="ctx-dot" style="background:#4a9eff;"></span> Deplacer &#9656;
        <div class="ctx-submenu" id="ctx-deplacer-sub">
            <div class="ctx-item" id="ctx-deplacer"><span class="ctx-dot" style="background:#4a9eff;"></span> Libre (XZ)</div>
            <div class="ctx-item" id="ctx-deplacer-v"><span class="ctx-dot" style="background:#ffcc00;"></span> Vertical (Y)</div>
            <div class="ctx-item" id="ctx-deplacer-h"><span class="ctx-dot" style="background:#00ccff;"></span> Horizontal (X)</div>
        </div>
    </div>
    <div class="ctx-item ctx-sub-parent" id="ctx-agrandir-menu"><span class="ctx-dot" style="background:#00ccff;"></span> Agrandir &#9656;
        <div class="ctx-submenu" id="ctx-agrandir-sub">
            <div class="ctx-item" id="ctx-agrandir"><span class="ctx-dot" style="background:#00ccff;"></span> Horizontal</div>
            <div class="ctx-item" id="ctx-agrandir-v"><span class="ctx-dot" style="background:#cc66ff;"></span> Vertical</div>
            <div class="ctx-item" id="ctx-agrandir-perp"><span class="ctx-dot" style="background:#ff8800;"></span> Perpendiculaire (90&deg;)</div>
            <div class="ctx-item" id="ctx-agrandir-prop" style="display:none;"><span class="ctx-dot" style="background:#43B047;"></span> Proportionnel</div>
        </div>
    </div>
    <div class="ctx-item" id="ctx-trou-select"><span class="ctx-dot" style="background:#e94560;"></span> Percer un trou</div>
    <div class="ctx-sep"></div>
    <div class="ctx-item" id="ctx-grouper"><span class="ctx-dot" style="background:#43B047;"></span> Grouper</div>
    <div class="ctx-item" id="ctx-degrouper" style="display:none;"><span class="ctx-dot" style="background:#e94560;"></span> Degrouper</div>
    <div class="ctx-sep"></div>
    <div class="ctx-item" id="ctx-supprimer"><span class="ctx-dot" style="background:#e94560;"></span> Supprimer</div>
</div>

<!-- Popup choix fenetre -->
<div id="fenetre-popup" class="popup" style="display:none; border-color:#5bb8f0;">
    <label class="popup-title" style="color:#5bb8f0;">Poser une fenetre</label>

    <div class="popup-row">
        <div><label>Cadre</label><input type="color" id="nf-cadre" value="#4a90d9"></div>
        <div><label>Vitre</label><input type="color" id="nf-vitre" value="#87CEEB"></div>
    </div>
    <div class="popup-row">
        <div><label>Opacite vitre %</label><input type="number" id="nf-opacite" min="0" max="100" value="30" step="5"></div>
    </div>

    <button id="btn-nf-appliquer-toutes" style="width:100%; margin-top:4px; margin-bottom:8px; padding:5px; background:#4a90d9; color:#fff; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:11px;">Appliquer a toutes les fenetres</button>

    <p style="color:#888; font-size:10px; margin-bottom:6px;">Choisissez un modele puis cliquez sur un mur</p>
    <div id="fenetre-modeles"></div>
    <button id="btn-nf-mode-precis" style="width:100%; margin-top:8px; padding:6px; background:#16213e; color:#ffa500; border:1px solid #ffa500; border-radius:4px; cursor:pointer; font-family:monospace; font-size:11px; display:none;">&#9881; Position precise (X, Y) — cliquez sur le mur</button>
</div>

<!-- Popup fenetre precise (etapes) -->
<div id="nf-precis-popup" class="popup" style="display:none; border-color:#ffa500; top:auto; bottom:60px; left:50%; transform:translateX(-50%); text-align:center; width:280px;">
    <label class="popup-title" style="color:#ffa500;">Fenetre — Position precise</label>
    <span id="nf-precis-mur" style="color:#888; font-size:10px; display:block; margin-bottom:8px;"></span>

    <!-- Etape 1 : X -->
    <div id="nf-step-x">
        <p style="color:#ffa500; font-size:12px; margin:4px 0;">Etape 1/2 — Position X</p>
        <label>X sur le mur (m)</label>
        <input type="range" id="nf-pos-x-range" min="0" max="5" step="0.05" value="1" style="width:100%;">
        <input type="number" id="nf-pos-x" value="1.00" step="0.05" min="0" style="width:80px; text-align:center; margin:4px auto; display:block;">
        <button id="btn-nf-next-y" style="width:100%; margin-top:8px; padding:8px; background:#ffa500; color:#000; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:13px; font-weight:bold;">Suivant → Y</button>
    </div>

    <!-- Etape 2 : Y -->
    <div id="nf-step-y" style="display:none;">
        <p style="color:#ffa500; font-size:12px; margin:4px 0;">Etape 2/2 — Position Y</p>
        <label>Y hauteur (m)</label>
        <input type="range" id="nf-pos-y-range" min="0" max="2.5" step="0.05" value="0.90" style="width:100%;">
        <input type="number" id="nf-pos-y" value="0.90" step="0.05" min="0" style="width:80px; text-align:center; margin:4px auto; display:block;">
        <div style="display:flex; gap:6px; margin-top:8px;">
            <button id="btn-nf-back-x" style="flex:1; padding:8px; background:#16213e; color:#ffa500; border:1px solid #ffa500; border-radius:4px; cursor:pointer; font-family:monospace; font-size:12px;">← Retour X</button>
            <button id="btn-nf-precis-valider" style="flex:2; padding:8px; background:#43B047; color:#fff; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:13px; font-weight:bold;">Valider</button>
        </div>
    </div>

    <button id="btn-nf-precis-annuler" style="width:100%; margin-top:6px; padding:6px; background:none; color:#e94560; border:1px solid #e94560; border-radius:4px; cursor:pointer; font-family:monospace; font-size:11px;">Annuler</button>
</div>

<!-- Menu contextuel fenetre -->
<div id="ctx-fenetre-menu" style="display:none; position:fixed; background:rgba(26,26,46,0.95); border:1px solid #5bb8f0; border-radius:8px; padding:4px 0; z-index:20; min-width:160px; font-family:monospace; font-size:12px;">
    <div class="ctx-item" id="ctx-fenetre-editer"><span class="ctx-dot" style="background:#5bb8f0;"></span> Editer la fenetre</div>
    <div class="ctx-item ctx-sub-parent" id="ctx-fenetre-deplacer-menu"><span class="ctx-dot" style="background:#4a9eff;"></span> Deplacer &#9656;
        <div class="ctx-submenu">
            <div class="ctx-item" id="ctx-fenetre-deplacer"><span class="ctx-dot" style="background:#4a9eff;"></span> Libre (clic)</div>
            <div class="ctx-item" id="ctx-fenetre-deplacer-x"><span class="ctx-dot" style="background:#00ccff;"></span> Horizontal (X)</div>
            <div class="ctx-item" id="ctx-fenetre-deplacer-y"><span class="ctx-dot" style="background:#ffcc00;"></span> Vertical (Y)</div>
        </div>
    </div>
    <div class="ctx-item" id="ctx-fenetre-supprimer"><span class="ctx-dot" style="background:#e94560;"></span> Supprimer la fenetre</div>
</div>

<!-- Popup choix porte -->
<div id="porte-popup" class="popup" style="display:none; border-color:#D2691E;">
    <label class="popup-title" style="color:#D2691E;">Poser une porte</label>

    <div class="popup-row">
        <div><label>Cadre</label><input type="color" id="np-cadre" value="#8B4513"></div>
        <div><label>Porte</label><input type="color" id="np-porte" value="#D2691E"></div>
    </div>

    <button id="btn-np-appliquer-toutes" style="width:100%; margin-top:4px; margin-bottom:8px; padding:5px; background:#8B4513; color:#fff; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:11px;">Appliquer a toutes les portes</button>

    <p style="color:#888; font-size:10px; margin-bottom:6px;">Choisissez un modele puis cliquez sur un mur</p>
    <div id="porte-modeles"></div>
    <button id="btn-np-mode-precis" style="width:100%; margin-top:8px; padding:6px; background:#16213e; color:#ffa500; border:1px solid #ffa500; border-radius:4px; cursor:pointer; font-family:monospace; font-size:11px; display:none;">&#9881; Position precise (X, Y) — cliquez sur le mur</button>
</div>

<!-- Popup porte precise (etapes) -->
<div id="np-precis-popup" class="popup" style="display:none; border-color:#ffa500; top:auto; bottom:60px; left:50%; transform:translateX(-50%); text-align:center; width:280px;">
    <label class="popup-title" style="color:#ffa500;">Porte — Position precise</label>
    <span id="np-precis-mur" style="color:#888; font-size:10px; display:block; margin-bottom:8px;"></span>

    <!-- Etape 1 : X -->
    <div id="np-step-x">
        <p style="color:#ffa500; font-size:12px; margin:4px 0;">Etape 1/2 — Position X</p>
        <label>X sur le mur (m)</label>
        <input type="range" id="np-pos-x-range" min="0" max="5" step="0.05" value="1" style="width:100%;">
        <input type="number" id="np-pos-x" value="1.00" step="0.05" min="0" style="width:80px; text-align:center; margin:4px auto; display:block;">
        <button id="btn-np-next-y" style="width:100%; margin-top:8px; padding:8px; background:#ffa500; color:#000; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:13px; font-weight:bold;">Suivant → Y</button>
    </div>

    <!-- Etape 2 : Y -->
    <div id="np-step-y" style="display:none;">
        <p style="color:#ffa500; font-size:12px; margin:4px 0;">Etape 2/2 — Position Y</p>
        <label>Y hauteur (m)</label>
        <input type="range" id="np-pos-y-range" min="0" max="2.5" step="0.05" value="0" style="width:100%;">
        <input type="number" id="np-pos-y" value="0" step="0.05" min="0" style="width:80px; text-align:center; margin:4px auto; display:block;">
        <div style="display:flex; gap:6px; margin-top:8px;">
            <button id="btn-np-back-x" style="flex:1; padding:8px; background:#16213e; color:#ffa500; border:1px solid #ffa500; border-radius:4px; cursor:pointer; font-family:monospace; font-size:12px;">← Retour X</button>
            <button id="btn-np-precis-valider" style="flex:2; padding:8px; background:#43B047; color:#fff; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:13px; font-weight:bold;">Valider</button>
        </div>
    </div>

    <button id="btn-np-precis-annuler" style="width:100%; margin-top:6px; padding:6px; background:none; color:#e94560; border:1px solid #e94560; border-radius:4px; cursor:pointer; font-family:monospace; font-size:11px;">Annuler</button>
</div>

<!-- Menu contextuel porte -->
<div id="ctx-porte-menu" style="display:none; position:fixed; background:rgba(26,26,46,0.95); border:1px solid #D2691E; border-radius:8px; padding:4px 0; z-index:20; min-width:160px; font-family:monospace; font-size:12px;">
    <div class="ctx-item" id="ctx-porte-editer"><span class="ctx-dot" style="background:#D2691E;"></span> Editer la porte</div>
    <div class="ctx-item ctx-sub-parent" id="ctx-porte-deplacer-menu"><span class="ctx-dot" style="background:#8B4513;"></span> Deplacer &#9656;
        <div class="ctx-submenu">
            <div class="ctx-item" id="ctx-porte-deplacer"><span class="ctx-dot" style="background:#8B4513;"></span> Libre (clic)</div>
            <div class="ctx-item" id="ctx-porte-deplacer-x"><span class="ctx-dot" style="background:#00ccff;"></span> Horizontal (X)</div>
            <div class="ctx-item" id="ctx-porte-deplacer-y"><span class="ctx-dot" style="background:#ffcc00;"></span> Vertical (Y)</div>
        </div>
    </div>
    <div class="ctx-item" id="ctx-porte-supprimer"><span class="ctx-dot" style="background:#e94560;"></span> Supprimer la porte</div>
</div>

<!-- Popup edition porte -->
<div id="edit-porte-popup" class="popup" style="display:none; border-color:#D2691E;">
    <label class="popup-title" style="color:#D2691E;">Editer la porte</label>
    <div class="popup-row">
        <div><label>Cadre</label><input type="color" id="ep-cadre" value="#8B4513"></div>
        <div><label>Porte</label><input type="color" id="ep-porte" value="#D2691E"></div>
    </div>
    <button id="btn-ep-appliquer" style="width:100%; margin-top:8px; padding:6px; background:#D2691E; color:#fff; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:12px; font-weight:bold;">Appliquer</button>
</div>

<!-- Popup edition fenetre -->
<div id="edit-fenetre-popup" class="popup" style="display:none; border-color:#5bb8f0;">
    <label class="popup-title" style="color:#5bb8f0;">Editer la fenetre</label>
    <div class="popup-row">
        <div><label>Cadre</label><input type="color" id="ef-cadre" value="#4a90d9"></div>
        <div><label>Vitre</label><input type="color" id="ef-vitre" value="#87CEEB"></div>
    </div>
    <div class="popup-row">
        <div><label>Opacite vitre %</label><input type="number" id="ef-opacite" min="0" max="100" value="30" step="5"></div>
    </div>
    <button id="btn-ef-appliquer" style="width:100%; margin-top:8px; padding:6px; background:#5bb8f0; color:#fff; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:12px; font-weight:bold;">Appliquer</button>
</div>

<!-- Popup choix laine de verre -->
<div id="laine-popup" class="popup" style="display:none; border-color:#F2D544;">
    <label class="popup-title" style="color:#F2D544;">Poser de la laine de verre</label>

    <div class="popup-row">
        <div><label>Couleur</label><input type="color" id="nlv-couleur" value="#F2D544"></div>
        <div><label>Opacite %</label><input type="number" id="nlv-opacite" min="0" max="100" value="99" step="5"></div>
    </div>

    <button id="btn-nlv-appliquer-tous" style="width:100%; margin-top:4px; margin-bottom:4px; padding:5px; background:#F2D544; color:#000; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:11px;">Appliquer a toutes les laines</button>

    <label style="display:flex; align-items:center; gap:6px; color:#aaa; font-size:11px; margin-bottom:6px; cursor:pointer;">
        <input type="checkbox" id="nlv-recouvrir" checked style="accent-color:#F2D544;"> Recouvrir tout le mur (1 clic)
    </label>
    <label style="display:flex; align-items:center; gap:6px; color:#aaa; font-size:11px; margin-bottom:6px; cursor:pointer;">
        <input type="checkbox" id="nlv-piece" style="accent-color:#43B047;"> Recouvrir toute la piece
    </label>

    <p style="color:#888; font-size:10px; margin-bottom:6px;">Choisissez un modele puis cliquez sur un mur</p>
    <div id="laine-modeles"></div>
</div>

<!-- Menu contextuel laine de verre -->
<div id="ctx-laine-menu" style="display:none; position:fixed; background:rgba(26,26,46,0.95); border:1px solid #F2D544; border-radius:8px; padding:4px 0; z-index:20; min-width:160px; font-family:monospace; font-size:12px;">
    <div class="ctx-item" id="ctx-laine-editer"><span class="ctx-dot" style="background:#F2D544;"></span> Editer la laine</div>
    <div class="ctx-item" id="ctx-laine-agrandir"><span class="ctx-dot" style="background:#00ccff;"></span> Agrandir</div>
    <div class="ctx-item" id="ctx-laine-deplacer"><span class="ctx-dot" style="background:#4a9eff;"></span> Deplacer</div>
    <div class="ctx-item" id="ctx-laine-supprimer"><span class="ctx-dot" style="background:#e94560;"></span> Supprimer</div>
</div>

<!-- Popup edition laine de verre -->
<div id="edit-laine-popup" class="popup" style="display:none; border-color:#F2D544;">
    <label class="popup-title" style="color:#F2D544;">Editer la laine</label>
    <div class="popup-row">
        <div><label>Couleur</label><input type="color" id="elv-couleur" value="#F2D544"></div>
        <div><label>Opacite %</label><input type="number" id="elv-opacite" min="0" max="100" value="99" step="5"></div>
    </div>
    <button id="btn-elv-appliquer" style="width:100%; margin-top:8px; padding:6px; background:#F2D544; color:#000; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:12px; font-weight:bold;">Appliquer</button>
</div>

<!-- Popup choix placo -->
<div id="placo-popup" class="popup" style="display:none; border-color:#C8C0B8;">
    <label class="popup-title" style="color:#C8C0B8;">Poser du placo</label>

    <div class="popup-row">
        <div><label>Couleur</label><input type="color" id="npl-couleur" value="#F5F5F0"></div>
        <div><label>Opacite %</label><input type="number" id="npl-opacite" min="0" max="100" value="99" step="5"></div>
    </div>

    <div class="popup-row">
        <div><label>Cote</label>
            <select id="npl-cote" style="width:100%; padding:4px; background:#16213e; color:#fff; border:1px solid #333; border-radius:3px; font-family:monospace; font-size:11px;">
                <option value="1">Devant</option>
                <option value="-1">Derriere</option>
            </select>
        </div>
    </div>

    <button id="btn-npl-appliquer-tous" style="width:100%; margin-top:4px; margin-bottom:4px; padding:5px; background:#C8C0B8; color:#000; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:11px;">Appliquer a tous les placos</button>

    <label style="display:flex; align-items:center; gap:6px; color:#aaa; font-size:11px; margin-bottom:6px; cursor:pointer;">
        <input type="checkbox" id="npl-recouvrir" checked style="accent-color:#C8C0B8;"> Recouvrir tout le mur (1 clic)
    </label>
    <label style="display:flex; align-items:center; gap:6px; color:#aaa; font-size:11px; margin-bottom:6px; cursor:pointer;">
        <input type="checkbox" id="npl-piece" style="accent-color:#43B047;"> Recouvrir toute la piece
    </label>
    <label style="display:flex; align-items:center; gap:6px; color:#aaa; font-size:11px; margin-bottom:6px; cursor:pointer;">
        <input type="checkbox" id="npl-2cotes" style="accent-color:#ffa500;"> Contourner tout le mur (2 cotes)
    </label>

    <p style="color:#888; font-size:10px; margin-bottom:6px;">Choisissez un modele puis cliquez sur un mur</p>
    <div id="placo-modeles"></div>
</div>

<!-- Menu contextuel placo -->
<div id="ctx-placo-menu" style="display:none; position:fixed; background:rgba(26,26,46,0.95); border:1px solid #C8C0B8; border-radius:8px; padding:4px 0; z-index:20; min-width:160px; font-family:monospace; font-size:12px;">
    <div class="ctx-item" id="ctx-placo-editer"><span class="ctx-dot" style="background:#C8C0B8;"></span> Editer le placo</div>
    <div class="ctx-item" id="ctx-placo-agrandir"><span class="ctx-dot" style="background:#00ccff;"></span> Agrandir</div>
    <div class="ctx-item" id="ctx-placo-deplacer"><span class="ctx-dot" style="background:#4a9eff;"></span> Deplacer</div>
    <div class="ctx-item" id="ctx-placo-supprimer"><span class="ctx-dot" style="background:#e94560;"></span> Supprimer</div>
</div>

<!-- Popup edition placo -->
<div id="edit-placo-popup" class="popup" style="display:none; border-color:#C8C0B8;">
    <label class="popup-title" style="color:#C8C0B8;">Editer le placo</label>
    <div class="popup-row">
        <div><label>Couleur</label><input type="color" id="epl-couleur" value="#F5F5F0"></div>
        <div><label>Opacite %</label><input type="number" id="epl-opacite" min="0" max="100" value="99" step="5"></div>
    </div>
    <button id="btn-epl-appliquer" style="width:100%; margin-top:8px; padding:6px; background:#C8C0B8; color:#000; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:12px; font-weight:bold;">Appliquer</button>
</div>

<!-- Barre d'outils -->
<!-- Boussole 3D -->
<div id="boussole"><canvas id="boussole-canvas" width="120" height="120"></canvas></div>

<div id="toolbar">
    <!-- Toggle mode texte/icone -->
    <div class="tool-btn" id="btn-toggle-mode" title="Basculer texte / icone" style="min-width:28px; width:28px; height:28px; border-color:#555; align-self:center;">
        <svg viewBox="0 0 24 24" style="width:16px; height:16px;" fill="none">
            <rect x="2" y="3" width="20" height="4" rx="1" fill="#888"/>
            <rect x="2" y="10" width="20" height="4" rx="1" fill="#888"/>
            <rect x="2" y="17" width="20" height="4" rx="1" fill="#888"/>
        </svg>
    </div>

    <!-- ══════ CONSTRUCTION ══════ -->
    <div class="tool-cat" data-cat="construction">
        <div class="tool-cat-btn" data-cat="construction" title="Construction">
            <svg viewBox="0 0 40 40" fill="none">
                <rect x="3" y="8" width="16" height="6" rx="1" fill="#8B4513"/>
                <rect x="21" y="8" width="16" height="6" rx="1" fill="#A0522D"/>
                <rect x="11" y="16" width="16" height="6" rx="1" fill="#8B4513"/>
                <rect x="3" y="24" width="16" height="6" rx="1" fill="#A0522D"/>
            </svg>
            <span class="cat-label">Constr.</span>
            <span class="cat-label-big">Construction</span>
        </div>
        <div class="tool-cat-panel" data-cat="construction">

    <!-- Bouton Mur (ouvre le sous-menu directions) -->
    <div class="tool-btn" id="btn-mur" title="Construire un mur" data-label="Mur">
        <svg viewBox="0 0 40 40" fill="none">
            <rect x="3" y="8" width="16" height="6" rx="1" fill="#8B4513"/>
            <rect x="21" y="8" width="16" height="6" rx="1" fill="#A0522D"/>
            <rect x="11" y="16" width="16" height="6" rx="1" fill="#8B4513"/>
            <rect x="3" y="24" width="16" height="6" rx="1" fill="#A0522D"/>
            <rect x="21" y="24" width="16" height="6" rx="1" fill="#8B4513"/>
        </svg>
    </div>

    <!-- Bouton fenetre -->
    <div class="tool-btn" id="btn-fenetre" title="Poser une fenetre" data-label="Fenetre">
        <svg viewBox="0 0 40 40" fill="none">
            <rect x="6" y="6" width="28" height="28" rx="2" fill="none" stroke="#5bb8f0" stroke-width="2"/>
            <line x1="20" y1="6" x2="20" y2="34" stroke="#5bb8f0" stroke-width="1.5"/>
            <line x1="6" y1="20" x2="34" y2="20" stroke="#5bb8f0" stroke-width="1.5"/>
            <rect x="8" y="8" width="10" height="10" fill="#87CEEB" fill-opacity="0.4"/>
            <rect x="22" y="8" width="10" height="10" fill="#87CEEB" fill-opacity="0.4"/>
            <rect x="8" y="22" width="10" height="10" fill="#87CEEB" fill-opacity="0.4"/>
            <rect x="22" y="22" width="10" height="10" fill="#87CEEB" fill-opacity="0.4"/>
        </svg>
    </div>

    <!-- Bouton porte -->
    <div class="tool-btn" id="btn-porte" title="Poser une porte" data-label="Porte">
        <svg viewBox="0 0 40 40" fill="none">
            <rect x="8" y="4" width="24" height="34" rx="2" fill="none" stroke="#D2691E" stroke-width="2"/>
            <rect x="11" y="6" width="18" height="30" fill="#D2691E" fill-opacity="0.3"/>
            <circle cx="26" cy="22" r="2" fill="#C0C0C0"/>
        </svg>
    </div>

    <!-- Bouton placo -->
    <div class="tool-btn" id="btn-placo" title="Poser du placo" data-label="Placo">
        <svg viewBox="0 0 40 40" fill="none">
            <rect x="6" y="4" width="28" height="34" rx="2" fill="#F5F5F0" stroke="#C8C0B8" stroke-width="2"/>
            <line x1="6" y1="15" x2="34" y2="15" stroke="#E0DDD5" stroke-width="1" stroke-dasharray="3,2"/>
            <line x1="6" y1="26" x2="34" y2="26" stroke="#E0DDD5" stroke-width="1" stroke-dasharray="3,2"/>
        </svg>
    </div>

    <!-- Bouton laine de verre -->
    <div class="tool-btn" id="btn-laine" title="Poser de la laine de verre" data-label="Laine">
        <svg viewBox="0 0 40 40" fill="none">
            <rect x="6" y="4" width="28" height="34" rx="2" fill="#F2D544" stroke="#D4A017" stroke-width="2"/>
            <line x1="6" y1="9" x2="34" y2="9" stroke="#E8C840" stroke-width="1"/>
            <line x1="6" y1="14" x2="34" y2="14" stroke="#E8C840" stroke-width="1"/>
            <line x1="6" y1="19" x2="34" y2="19" stroke="#E8C840" stroke-width="1"/>
            <line x1="6" y1="24" x2="34" y2="24" stroke="#E8C840" stroke-width="1"/>
            <line x1="6" y1="29" x2="34" y2="29" stroke="#E8C840" stroke-width="1"/>
            <line x1="6" y1="34" x2="34" y2="34" stroke="#E8C840" stroke-width="1"/>
        </svg>
    </div>

    <!-- Bouton plinthe -->
    <div class="tool-btn" id="btn-plinthe" title="Poser une plinthe (sur le placo)" data-label="Plinthe">
        <svg viewBox="0 0 40 40" fill="none">
            <rect x="4" y="28" width="32" height="8" rx="1" fill="#A0764E" stroke="#8B6538" stroke-width="1.5"/>
            <line x1="4" y1="30" x2="36" y2="30" stroke="#B8885A" stroke-width="0.8"/>
            <rect x="4" y="6" width="32" height="22" rx="1" fill="#F5F5F0" stroke="#C8C0B8" stroke-width="1"/>
        </svg>
    </div>

    <!-- Popup plinthe -->
    <div id="plinthe-popup" class="popup" style="display:none; border-color:#A0764E; width:220px;">
        <label class="popup-title" style="color:#A0764E;">Plinthe (sur placo)</label>
        <div id="plinthe-modeles"></div>
        <div class="popup-row" style="margin-top:8px;">
            <div><label>Couleur</label><input type="color" id="plinthe-couleur" value="#D4C8B0"></div>
        </div>
        <label style="display:flex; align-items:center; gap:8px; margin-top:8px; cursor:pointer; color:#fff; font-size:12px; padding:6px 8px; background:rgba(160,118,78,0.15); border:1px solid #A0764E; border-radius:4px;">
            <input type="checkbox" id="plinthe-tout-mur" style="accent-color:#A0764E; width:16px; height:16px; cursor:pointer;"> Tout le mur (1 clic)
        </label>
        <p style="color:#888; font-size:10px; margin-top:4px;">Cliquez sur un placo pour poser la plinthe au pied</p>
    </div>

    <!-- Menu contextuel plinthe -->
    <div id="ctx-plinthe-menu" style="display:none; position:fixed; background:rgba(26,26,46,0.95); border:1px solid #A0764E; border-radius:8px; padding:4px 0; z-index:20; min-width:160px; font-family:monospace; font-size:12px;">
        <div class="ctx-item" id="ctx-plinthe-editer"><span class="ctx-dot" style="background:#A0764E;"></span> Editer couleur</div>
        <div class="ctx-item" id="ctx-plinthe-supprimer"><span class="ctx-dot" style="background:#e94560;"></span> Supprimer</div>
    </div>

    <!-- Bouton carrelage -->
    <div class="tool-btn" id="btn-carrelage" title="Poser du carrelage (sur le placo)" data-label="Carrelage">
        <svg viewBox="0 0 40 40" fill="none">
            <rect x="4" y="4" width="14" height="14" rx="1" fill="#E8E0D0" stroke="#C8C0B0" stroke-width="1.5"/>
            <rect x="22" y="4" width="14" height="14" rx="1" fill="#E8E0D0" stroke="#C8C0B0" stroke-width="1.5"/>
            <rect x="4" y="22" width="14" height="14" rx="1" fill="#E8E0D0" stroke="#C8C0B0" stroke-width="1.5"/>
            <rect x="22" y="22" width="14" height="14" rx="1" fill="#E8E0D0" stroke="#C8C0B0" stroke-width="1.5"/>
        </svg>
    </div>

    <!-- Popup carrelage -->
    <div id="carrelage-popup" class="popup" style="display:none; border-color:#C8C0B0; width:240px;">
        <label class="popup-title" style="color:#C8C0B0;">Carrelage (sur placo)</label>
        <div id="carrelage-modeles"></div>
        <div class="popup-row" style="margin-top:8px;">
            <div><label>Carreau</label><input type="color" id="carrelage-couleur" value="#E8E0D0"></div>
            <div><label>Joint</label><input type="color" id="carrelage-joint" value="#C8C0B0"></div>
        </div>
        <div class="popup-row" style="margin-top:6px;">
            <div><label>Larg (cm)</label><input type="number" id="carrelage-larg" value="20" min="1" max="200" step="1" style="width:55px;"></div>
            <div><label>Haut (cm)</label><input type="number" id="carrelage-haut" value="20" min="1" max="200" step="1" style="width:55px;"></div>
        </div>
        <label style="display:flex; align-items:center; gap:8px; margin-top:8px; cursor:pointer; color:#fff; font-size:12px; padding:6px 8px; background:rgba(200,192,176,0.15); border:1px solid #C8C0B0; border-radius:4px;">
            <input type="checkbox" id="carrelage-tout-mur" style="accent-color:#C8C0B0; width:16px; height:16px; cursor:pointer;"> Tout le mur (1 clic)
        </label>
        <p style="color:#888; font-size:10px; margin-top:4px;">Cliquez sur un placo pour poser le carrelage</p>
    </div>

    <!-- Menu contextuel carrelage -->
    <div id="ctx-carrelage-menu" style="display:none; position:fixed; background:rgba(26,26,46,0.95); border:1px solid #C8C0B0; border-radius:8px; padding:4px 0; z-index:20; min-width:160px; font-family:monospace; font-size:12px;">
        <div class="ctx-item" id="ctx-carrelage-editer"><span class="ctx-dot" style="background:#C8C0B0;"></span> Editer couleurs</div>
        <div class="ctx-item" id="ctx-carrelage-supprimer"><span class="ctx-dot" style="background:#e94560;"></span> Supprimer</div>
    </div>

    <!-- Bouton carrelage sol -->
    <div class="tool-btn" id="btn-carrelage-sol" title="Poser du carrelage au sol (dans une piece)" data-label="Sol">
        <svg viewBox="0 0 40 40" fill="none">
            <rect x="4" y="4" width="14" height="14" rx="1" fill="#D4C4A8" stroke="#A09080" stroke-width="1.5"/>
            <rect x="22" y="4" width="14" height="14" rx="1" fill="#D4C4A8" stroke="#A09080" stroke-width="1.5"/>
            <rect x="4" y="22" width="14" height="14" rx="1" fill="#D4C4A8" stroke="#A09080" stroke-width="1.5"/>
            <rect x="22" y="22" width="14" height="14" rx="1" fill="#D4C4A8" stroke="#A09080" stroke-width="1.5"/>
            <line x1="2" y1="38" x2="38" y2="38" stroke="#A09080" stroke-width="2"/>
        </svg>
    </div>

    <!-- Popup carrelage sol -->
    <div id="carrelage-sol-popup" class="popup" style="display:none; border-color:#A09080; width:240px;">
        <label class="popup-title" style="color:#A09080;">Carrelage sol (dans piece)</label>
        <div id="carrelage-sol-modeles"></div>
        <div class="popup-row" style="margin-top:8px;">
            <div><label>Carreau</label><input type="color" id="cs-couleur" value="#D4C4A8"></div>
            <div><label>Joint</label><input type="color" id="cs-joint" value="#A09080"></div>
        </div>
        <div class="popup-row" style="margin-top:6px;">
            <div><label>Larg (cm)</label><input type="number" id="cs-larg" value="30" min="1" max="200" step="1" style="width:55px;"></div>
            <div><label>Haut (cm)</label><input type="number" id="cs-haut" value="30" min="1" max="200" step="1" style="width:55px;"></div>
        </div>
        <div class="popup-row" style="margin-top:6px;">
            <div><label>Joint (mm)</label><input type="number" id="cs-joint-ep" value="3" min="1" max="15" step="1" style="width:55px;"></div>
            <div><label>Angle</label>
                <select id="cs-angle" style="width:75px; padding:3px; background:#16213e; color:#ccc; border:1px solid #444; border-radius:3px; font-size:11px;">
                    <option value="0">Droit 0°</option>
                    <option value="45">Diagonal 45°</option>
                    <option value="decale">Decale</option>
                </select>
            </div>
        </div>
        <label style="display:flex; align-items:center; gap:8px; margin-top:6px; cursor:pointer; color:#fff; font-size:11px;">
            <input type="checkbox" id="cs-label" checked style="accent-color:#A09080;"> Afficher surface (m²)
        </label>
        <p style="color:#888; font-size:10px; margin-top:4px;">Cliquez dans une piece fermee pour carreler le sol</p>
    </div>

    <!-- Bouton papier peint -->
    <div class="tool-btn" id="btn-papier-peint" title="Poser du papier peint (sur le placo)" data-label="Papier P.">
        <svg viewBox="0 0 40 40" fill="none">
            <rect x="4" y="4" width="32" height="32" rx="2" fill="#F5EDE0" stroke="#D8C8B0" stroke-width="1.5"/>
            <line x1="10" y1="4" x2="10" y2="36" stroke="#E8D8C4" stroke-width="2.5"/>
            <line x1="18" y1="4" x2="18" y2="36" stroke="#E8D8C4" stroke-width="2.5"/>
            <line x1="26" y1="4" x2="26" y2="36" stroke="#E8D8C4" stroke-width="2.5"/>
            <line x1="34" y1="4" x2="34" y2="36" stroke="#E8D8C4" stroke-width="2.5"/>
        </svg>
    </div>

    <!-- Popup papier peint -->
    <div id="papier-peint-popup" class="popup" style="display:none; border-color:#D8C8B0; width:240px;">
        <label class="popup-title" style="color:#D8C8B0;">Papier peint (sur placo)</label>
        <div id="papier-peint-modeles"></div>
        <div class="popup-row" style="margin-top:8px;">
            <div><label>Couleur 1</label><input type="color" id="pp-couleur1" value="#F5EDE0"></div>
            <div><label>Couleur 2</label><input type="color" id="pp-couleur2" value="#E8D8C4"></div>
        </div>
        <label style="display:flex; align-items:center; gap:8px; margin-top:8px; cursor:pointer; color:#fff; font-size:12px; padding:6px 8px; background:rgba(216,200,176,0.15); border:1px solid #D8C8B0; border-radius:4px;">
            <input type="checkbox" id="pp-tout-mur" style="accent-color:#D8C8B0; width:16px; height:16px; cursor:pointer;"> Tout le mur (1 clic)
        </label>
        <p style="color:#888; font-size:10px; margin-top:4px;">Cliquez sur un placo pour poser le papier peint</p>
    </div>

    <!-- Menu contextuel papier peint -->
    <div id="ctx-pp-menu" style="display:none; position:fixed; background:rgba(26,26,46,0.95); border:1px solid #D8C8B0; border-radius:8px; padding:4px 0; z-index:20; min-width:160px; font-family:monospace; font-size:12px;">
        <div class="ctx-item" id="ctx-pp-editer"><span class="ctx-dot" style="background:#D8C8B0;"></span> Editer couleurs</div>
        <div class="ctx-item" id="ctx-pp-supprimer"><span class="ctx-dot" style="background:#e94560;"></span> Supprimer</div>
    </div>

    <!-- Bouton trait au sol -->
    <div class="tool-btn" id="btn-trait" title="Tracer un trait au sol (delimitation)" data-label="Trait">
        <svg viewBox="0 0 40 40" fill="none">
            <line x1="6" y1="34" x2="34" y2="6" stroke="#4a9eff" stroke-width="2.5" stroke-dasharray="4,3"/>
            <circle cx="6" cy="34" r="3" fill="#4a9eff"/>
            <circle cx="34" cy="6" r="3" fill="#4a9eff"/>
            <line x1="6" y1="28" x2="12" y2="34" stroke="#FF9800" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
    </div>

    <!-- Bouton aimant -->
    <div class="tool-btn actif" id="btn-aimant" title="Aimant" data-label="Aimant">
        <svg viewBox="0 0 40 40" fill="none">
            <path d="M10 28 L10 16 C10 8 20 4 20 4 C20 4 30 8 30 16 L30 28" stroke="#e94560" stroke-width="3" fill="none"/>
            <rect x="7" y="28" width="8" height="5" rx="1" fill="#888"/>
            <rect x="25" y="28" width="8" height="5" rx="1" fill="#888"/>
            <line x1="10" y1="20" x2="30" y2="20" stroke="#43B047" stroke-width="1.5" stroke-dasharray="3,2"/>
        </svg>
    </div>

    <!-- Popup trait au sol -->
    <div id="trait-popup" class="popup" style="display:none; border-color:#4a9eff; width:180px;">
        <label class="popup-title" style="color:#4a9eff;">Trait au sol</label>
        <div class="popup-row">
            <div><label>Couleur</label><input type="color" id="trait-couleur" value="#4a9eff"></div>
            <div><label>Style</label>
                <select id="trait-style">
                    <option value="tirets" selected>Tirets</option>
                    <option value="plein">Plein</option>
                </select>
            </div>
        </div>
        <p style="color:#888; font-size:10px; margin-top:6px;">Cliquez+glissez pour dessiner un rectangle</p>
    </div>

    <!-- Popup editer trait -->
    <div id="edit-trait-popup" class="popup" style="display:none; border-color:#4a9eff; width:200px;">
        <label class="popup-title" style="color:#4a9eff;">Editer trait</label>
        <div class="popup-row">
            <div><label>Couleur</label><input type="color" id="et-couleur" value="#4a9eff"></div>
            <div><label>Style</label>
                <select id="et-style">
                    <option value="tirets">Tirets</option>
                    <option value="plein">Plein</option>
                </select>
            </div>
        </div>
        <div style="display:flex; gap:6px; margin-top:8px;">
            <button id="et-appliquer" style="flex:1; padding:6px; background:#4a9eff; color:#fff; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:12px; font-weight:bold;">Appliquer</button>
            <button id="et-supprimer" style="padding:6px 12px; background:#e94560; color:#fff; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:12px; font-weight:bold;">Supprimer</button>
        </div>
    </div>

    <!-- Menu contextuel trait -->
    <div id="ctx-trait-menu" style="display:none; position:fixed; background:rgba(26,26,46,0.95); border:1px solid #4a9eff; border-radius:8px; padding:4px 0; z-index:20; min-width:160px; font-family:monospace; font-size:12px;">
        <div class="ctx-item" id="ctx-trait-editer"><span class="ctx-dot" style="background:#4a9eff;"></span> Editer</div>
        <div class="ctx-item" id="ctx-trait-deplacer"><span class="ctx-dot" style="background:#43B047;"></span> Deplacer</div>
        <div class="ctx-item" id="ctx-trait-supprimer"><span class="ctx-dot" style="background:#e94560;"></span> Supprimer</div>
    </div>

    <!-- Menu contextuel personnage -->
    <div id="ctx-perso-menu" style="display:none; position:fixed; background:rgba(26,26,46,0.95); border:1px solid #2196F3; border-radius:8px; padding:4px 0; z-index:20; min-width:160px; font-family:monospace; font-size:12px;">
        <div class="ctx-item" id="ctx-perso-editer"><span class="ctx-dot" style="background:#2196F3;"></span> Editer couleurs</div>
        <div class="ctx-item" id="ctx-perso-deplacer"><span class="ctx-dot" style="background:#4a9eff;"></span> Deplacer</div>
        <div class="ctx-item" id="ctx-perso-supprimer"><span class="ctx-dot" style="background:#e94560;"></span> Supprimer</div>
    </div>

    <!-- Popup editer personnage -->
    <div id="edit-perso-popup" class="popup" style="display:none; border-color:#2196F3; width:200px;">
        <label class="popup-title" style="color:#2196F3;">Editer personnage</label>
        <div class="popup-row">
            <div><label>Peau</label><input type="color" id="ep-peau" value="#8B5E3C"></div>
            <div><label>Cheveux</label><input type="color" id="ep-cheveux" value="#1a1a1a"></div>
        </div>
        <div class="popup-row">
            <div><label>Haut</label><input type="color" id="ep-haut" value="#F0F0F0"></div>
            <div><label>Bas</label><input type="color" id="ep-bas" value="#CC2222"></div>
        </div>
        <div class="popup-row">
            <div><label>Chaussures</label><input type="color" id="ep-chaussures" value="#1a1a1a"></div>
            <div><label>Taille (cm)</label><input type="number" id="ep-taille" value="170" min="50" max="250" step="5"></div>
        </div>
        <button id="btn-ep-perso-ok" style="width:100%; margin-top:8px; padding:6px; background:#2196F3; color:#fff; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:12px; font-weight:bold;">OK</button>
    </div>

    <!-- Popup plafond -->
    <div id="plafond-4pts-popup" class="popup" style="display:none; border-color:#B0A090;">
        <label class="popup-title" style="color:#B0A090;">Plafond / Plancher</label>
        <div class="popup-row">
            <div><label>Hauteur (m)</label><input type="number" id="npf-hauteur" value="2.50" min="0.50" max="10.00" step="0.05" style="width:70px;"></div>
            <div><label>Epaisseur (cm)</label><input type="number" id="npf-ep" value="20" min="5" max="50" step="1" style="width:70px;"></div>
        </div>
        <div class="popup-row">
            <div><label>Dalle</label><input type="color" id="npf-couleur" value="#C8C0B0"></div>
            <div><label>Poteaux</label><input type="color" id="npf-poteau" value="#8B8070"></div>
        </div>
        <div class="popup-row">
            <div style="display:flex; align-items:center; gap:6px;">
                <input type="checkbox" id="npf-poteaux" checked>
                <label for="npf-poteaux" style="cursor:pointer;">Afficher poteaux</label>
            </div>
        </div>
        <div class="popup-row" style="align-items:center;">
            <div style="flex:1;">
                <label style="font-size:10px;">Apercu opacite</label>
                <input type="range" id="npf-ghost-opacite" min="5" max="80" value="30" style="width:100%;">
            </div>
            <span id="npf-ghost-opacite-val" style="color:#888; font-size:10px; min-width:28px; text-align:right;">30%</span>
        </div>
        <div style="display:flex; gap:4px; margin-top:6px;">
            <button id="btn-npf-mode-rect" style="flex:1; padding:6px; background:#B0A090; color:#fff; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:11px; font-weight:bold;">Rectangle (2 clics)</button>
            <button id="btn-npf-mode-4pts" style="flex:1; padding:6px; background:#16213e; color:#B0A090; border:1px solid #B0A090; border-radius:4px; cursor:pointer; font-family:monospace; font-size:11px;">4 points libres</button>
        </div>
        <p id="npf-etape" style="color:#B0A090; font-size:11px; margin-top:6px; font-weight:bold;">Cliquez le 1er coin au sol</p>
        <button id="btn-npf-annuler-point" style="width:100%; margin-top:4px; padding:5px; background:none; color:#e94560; border:1px solid #e94560; border-radius:4px; cursor:pointer; font-family:monospace; font-size:11px; display:none;">Annuler dernier point</button>
    </div>

    <!-- Menu contextuel plafond -->
    <div id="ctx-plafond-menu" style="display:none; position:fixed; background:rgba(26,26,46,0.95); border:1px solid #B0A090; border-radius:8px; padding:4px 0; z-index:20; min-width:160px; font-family:monospace; font-size:12px;">
        <div class="ctx-item" id="ctx-plafond-editer"><span class="ctx-dot" style="background:#B0A090;"></span> Editer plafond</div>
        <div class="ctx-item" id="ctx-plafond-toggle-poteaux"><span class="ctx-dot" style="background:#8B8070;"></span> Masquer/Afficher poteaux</div>
        <div class="ctx-item" id="ctx-plafond-supprimer"><span class="ctx-dot" style="background:#e94560;"></span> Supprimer</div>
    </div>

    <!-- Popup edition plafond -->
    <div id="edit-plafond-popup" class="popup" style="display:none; border-color:#B0A090; min-width:260px;">
        <label class="popup-title" style="color:#B0A090;">Editer plafond</label>
        <div class="popup-row">
            <div><label>Hauteur (m)</label><input type="number" id="epf-hauteur" value="2.50" min="0.50" max="10.00" step="0.05" style="width:70px;"></div>
            <div><label>Epaisseur (cm)</label><input type="number" id="epf-ep" value="20" min="5" max="50" step="1" style="width:70px;"></div>
        </div>
        <div class="popup-row">
            <div><label>Dalle</label><input type="color" id="epf-couleur" value="#C8C0B0"></div>
            <div><label>Poteaux</label><input type="color" id="epf-poteau" value="#8B8070"></div>
        </div>

        <p style="color:#B0A090; font-size:11px; margin:8px 0 4px; font-weight:bold;">Points (X, Z en metres)</p>
        <div id="epf-points-list" style="display:flex; flex-direction:column; gap:3px;"></div>

        <div style="display:flex; gap:6px; margin-top:8px;">
            <button id="btn-epf-appliquer" style="flex:2; padding:6px; background:#B0A090; color:#fff; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:12px; font-weight:bold;">Appliquer</button>
            <button id="btn-epf-deplacer-pt" style="flex:1; padding:6px; background:#16213e; color:#B0A090; border:1px solid #B0A090; border-radius:4px; cursor:pointer; font-family:monospace; font-size:11px;">Deplacer point</button>
        </div>
    </div>

    <!-- Popup choix escalier -->
    <div id="escalier-popup" class="popup" style="display:none; border-color:#A0522D;">
        <label class="popup-title" style="color:#A0522D;">Poser un escalier</label>
        <div class="popup-row">
            <div><label>Marches</label><input type="color" id="nesc-marche" value="#A0522D"></div>
            <div><label>Rampe</label><input type="color" id="nesc-rampe" value="#666666"></div>
        </div>
        <div class="popup-row">
            <div><label>Largeur (m)</label><input type="number" id="nesc-largeur" value="0.90" min="0.40" max="2.00" step="0.05" style="width:70px;"></div>
            <div><label>Longueur (m)</label><input type="number" id="nesc-longueur" value="3.50" min="1.00" max="8.00" step="0.10" style="width:70px;"></div>
        </div>
        <div class="popup-row">
            <div><label>Hauteur (m)</label><input type="number" id="nesc-hauteur" value="2.50" min="1.00" max="6.00" step="0.10" style="width:70px;"></div>
            <div><label>Nb marches</label><input type="number" id="nesc-nb" value="13" min="3" max="30" step="1" style="width:70px;"></div>
        </div>
        <p style="color:#888; font-size:10px; margin-bottom:6px;">Choisissez un modele puis cliquez sur le sol</p>
        <div id="escalier-modeles"></div>
    </div>

    <!-- Menu contextuel escalier -->
    <div id="ctx-escalier-menu" style="display:none; position:fixed; background:rgba(26,26,46,0.95); border:1px solid #A0522D; border-radius:8px; padding:4px 0; z-index:20; min-width:160px; font-family:monospace; font-size:12px;">
        <div class="ctx-item" id="ctx-escalier-editer"><span class="ctx-dot" style="background:#A0522D;"></span> Editer escalier</div>
        <div class="ctx-item" id="ctx-escalier-deplacer"><span class="ctx-dot" style="background:#4a9eff;"></span> Deplacer</div>
        <div class="ctx-item" id="ctx-escalier-supprimer"><span class="ctx-dot" style="background:#e94560;"></span> Supprimer</div>
    </div>

    <!-- Popup edition escalier -->
    <div id="edit-escalier-popup" class="popup" style="display:none; border-color:#A0522D;">
        <label class="popup-title" style="color:#A0522D;">Editer escalier</label>
        <div class="popup-row">
            <div><label>Marches</label><input type="color" id="eesc-marche" value="#A0522D"></div>
            <div><label>Rampe</label><input type="color" id="eesc-rampe" value="#666666"></div>
        </div>
        <div class="popup-row">
            <div><label>Largeur (m)</label><input type="number" id="eesc-largeur" value="0.90" min="0.40" max="2.00" step="0.05" style="width:70px;"></div>
            <div><label>Longueur (m)</label><input type="number" id="eesc-longueur" value="3.50" min="1.00" max="8.00" step="0.10" style="width:70px;"></div>
        </div>
        <div class="popup-row">
            <div><label>Hauteur (m)</label><input type="number" id="eesc-hauteur" value="2.50" min="1.00" max="6.00" step="0.10" style="width:70px;"></div>
            <div><label>Nb marches</label><input type="number" id="eesc-nb" value="13" min="3" max="30" step="1" style="width:70px;"></div>
        </div>
        <button id="btn-eesc-appliquer" style="width:100%; margin-top:8px; padding:6px; background:#A0522D; color:#fff; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:12px; font-weight:bold;">Appliquer</button>
    </div>

    <!-- Popup personnage -->
    <div id="personnage-popup" class="popup" style="display:none; border-color:#2196F3; width:200px;">
        <label class="popup-title" style="color:#2196F3;">Personnage</label>
        <div class="popup-row">
            <div><label>Peau</label><input type="color" id="perso-peau" value="#8B5E3C"></div>
            <div><label>Cheveux</label><input type="color" id="perso-cheveux" value="#1a1a1a"></div>
        </div>
        <div class="popup-row">
            <div><label>Haut</label><input type="color" id="perso-haut" value="#F0F0F0"></div>
            <div><label>Bas</label><input type="color" id="perso-bas" value="#CC2222"></div>
        </div>
        <div class="popup-row">
            <div><label>Chaussures</label><input type="color" id="perso-chaussures" value="#1a1a1a"></div>
            <div><label>Taille (cm)</label><input type="number" id="perso-taille" value="170" min="50" max="250" step="5"></div>
        </div>
        <p style="color:#888; font-size:10px; margin-top:6px;">Cliquez sur le sol pour placer</p>
    </div>

        </div><!-- /panel construction -->
    </div><!-- /cat construction -->

    <!-- ══════ STRUCTURE ══════ -->
    <div class="tool-cat" data-cat="structure">
        <div class="tool-cat-btn" data-cat="structure" title="Structure">
            <svg viewBox="0 0 40 40" fill="none">
                <rect x="6" y="10" width="28" height="4" rx="1" fill="#B0A090"/>
                <line x1="8" y1="14" x2="8" y2="34" stroke="#8B8070" stroke-width="2"/>
                <line x1="32" y1="14" x2="32" y2="34" stroke="#8B8070" stroke-width="2"/>
                <path d="M16 34 L16 30 L20 30 L20 26 L24 26 L24 22 L28 22 L28 34 Z" fill="#A0522D" stroke="#8B4513" stroke-width="0.8"/>
            </svg>
            <span class="cat-label">Struct.</span>
            <span class="cat-label-big">Structure</span>
        </div>
        <div class="tool-cat-panel" data-cat="structure">

    <!-- Bouton plafond -->
    <div class="tool-btn" id="btn-plafond" title="Poser un plafond/plancher (4 points)" data-label="Plafond">
        <svg viewBox="0 0 40 40" fill="none">
            <rect x="6" y="10" width="28" height="4" rx="1" fill="#B0A090" stroke="#8B8070" stroke-width="1.5"/>
            <line x1="8" y1="14" x2="8" y2="34" stroke="#8B8070" stroke-width="2"/>
            <line x1="32" y1="14" x2="32" y2="34" stroke="#8B8070" stroke-width="2"/>
            <line x1="14" y1="14" x2="14" y2="34" stroke="#8B8070" stroke-width="1" stroke-dasharray="3,3"/>
            <line x1="26" y1="14" x2="26" y2="34" stroke="#8B8070" stroke-width="1" stroke-dasharray="3,3"/>
        </svg>
        <span class="tool-label">Plafond</span>
    </div>

    <!-- Bouton escalier -->
    <div class="tool-btn" id="btn-escalier" title="Poser un escalier" data-label="Escalier">
        <svg viewBox="0 0 40 40" fill="none">
            <path d="M6 34 L6 30 L12 30 L12 26 L18 26 L18 22 L24 22 L24 18 L30 18 L30 14 L36 14 L36 34 Z" fill="#A0522D" stroke="#8B4513" stroke-width="1.5"/>
            <line x1="34" y1="14" x2="34" y2="34" stroke="#666" stroke-width="2"/>
        </svg>
        <span class="tool-label">Escalier</span>
    </div>

        </div><!-- /panel structure -->
    </div><!-- /cat structure -->

    <!-- ══════ OUTILS ══════ -->
    <div class="tool-cat" data-cat="outils">
        <div class="tool-cat-btn" data-cat="outils" title="Outils">
            <svg viewBox="0 0 40 40" fill="none">
                <line x1="6" y1="34" x2="34" y2="6" stroke="#00ccff" stroke-width="2" stroke-dasharray="4,3"/>
                <circle cx="6" cy="34" r="3" fill="#00ccff"/>
                <circle cx="34" cy="6" r="3" fill="#00ccff"/>
            </svg>
            <span class="cat-label">Outils</span>
            <span class="cat-label-big">Outils</span>
        </div>
        <div class="tool-cat-panel" data-cat="outils">

    <!-- Bouton personnage -->
    <div class="tool-btn" id="btn-personnage" title="Placer un personnage (1.70m)" data-label="Perso">
        <svg viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="10" r="4" fill="#8B5E3C" stroke="#6B4226" stroke-width="1"/>
            <rect x="15" y="15" width="10" height="10" rx="2" fill="#F0F0F0"/>
            <rect x="13" y="15" width="2.5" height="9" rx="1" fill="#F0F0F0"/>
            <rect x="24.5" y="15" width="2.5" height="9" rx="1" fill="#F0F0F0"/>
            <rect x="16" y="26" width="3.5" height="9" rx="1" fill="#CC2222"/>
            <rect x="20.5" y="26" width="3.5" height="9" rx="1" fill="#CC2222"/>
        </svg>
    </div>

    <!-- Bouton mesurer -->
    <div class="tool-btn" id="btn-mesurer" title="Mesurer une distance" data-label="Mesurer">
        <svg viewBox="0 0 40 40" fill="none">
            <line x1="6" y1="34" x2="34" y2="6" stroke="#00ccff" stroke-width="2" stroke-dasharray="4,3"/>
            <circle cx="6" cy="34" r="3" fill="#00ccff"/>
            <circle cx="34" cy="6" r="3" fill="#00ccff"/>
        </svg>
    </div>

        </div><!-- /panel outils -->
    </div><!-- /cat outils -->

    <!-- ══════ ZONES ══════ -->
    <div class="tool-cat" data-cat="zones">
        <div class="tool-cat-btn" data-cat="zones" title="Zones">
            <svg viewBox="0 0 40 40" fill="none">
                <rect x="6" y="6" width="28" height="28" rx="2" fill="none" stroke="#5bb8f0" stroke-width="2" stroke-dasharray="4,3"/>
                <path d="M20 14 L20 26 M14 20 L26 20" stroke="#5bb8f0" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span class="cat-label">Zones</span>
            <span class="cat-label-big">Zones</span>
        </div>
        <div class="tool-cat-panel" data-cat="zones">

    <div class="tool-btn" id="btn-deplacer-zone" title="Deplacer une zone" data-label="Deplacer">
        <svg viewBox="0 0 40 40" fill="none">
            <rect x="6" y="6" width="28" height="28" rx="2" fill="none" stroke="#5bb8f0" stroke-width="2" stroke-dasharray="4,3"/>
            <path d="M20 12 L20 28 M12 20 L28 20" stroke="#5bb8f0" stroke-width="2" stroke-linecap="round"/>
            <path d="M20 12 L17 15 M20 12 L23 15" stroke="#5bb8f0" stroke-width="2" stroke-linecap="round"/>
            <path d="M20 28 L17 25 M20 28 L23 25" stroke="#5bb8f0" stroke-width="2" stroke-linecap="round"/>
            <path d="M12 20 L15 17 M12 20 L15 23" stroke="#5bb8f0" stroke-width="2" stroke-linecap="round"/>
            <path d="M28 20 L25 17 M28 20 L25 23" stroke="#5bb8f0" stroke-width="2" stroke-linecap="round"/>
        </svg>
    </div>

    <div class="tool-btn" id="btn-copier-zone" title="Copier une zone" data-label="Copier">
        <svg viewBox="0 0 40 40" fill="none">
            <rect x="4" y="10" width="18" height="18" rx="2" fill="none" stroke="#43B047" stroke-width="2" stroke-dasharray="4,3"/>
            <rect x="14" y="4" width="18" height="18" rx="2" fill="none" stroke="#43B047" stroke-width="2"/>
            <rect x="16" y="6" width="14" height="14" rx="1" fill="#43B047" fill-opacity="0.15"/>
            <text x="23" y="16" text-anchor="middle" fill="#43B047" font-size="12" font-weight="bold" font-family="monospace">+</text>
        </svg>
    </div>

    <div class="tool-btn" id="btn-effacer-zone" title="Effacer une zone" data-label="Effacer">
        <svg viewBox="0 0 40 40" fill="none">
            <rect x="6" y="6" width="28" height="28" rx="2" fill="none" stroke="#e94560" stroke-width="2" stroke-dasharray="4,3"/>
            <line x1="10" y1="10" x2="30" y2="30" stroke="#e94560" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="30" y1="10" x2="10" y2="30" stroke="#e94560" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
    </div>

        </div><!-- /panel zones -->
    </div><!-- /cat zones -->

    <!-- Undo/Redo toujours visibles -->
    <div class="tool-btn" id="btn-undo" title="Marche arriere (Ctrl+Z)" data-label="Undo">
        <svg viewBox="0 0 40 40" fill="none">
            <path d="M12 14 L6 20 L12 26" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6 20 L24 20 C30 20 34 24 34 28 C34 32 30 34 26 34 L22 34" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        </svg>
    </div>

    <div class="tool-btn" id="btn-redo" title="Marche avant (Ctrl+Y)" data-label="Redo">
        <svg viewBox="0 0 40 40" fill="none">
            <path d="M28 14 L34 20 L28 26" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M34 20 L16 20 C10 20 6 24 6 28 C6 32 10 34 14 34 L18 34" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        </svg>
    </div>

    <!-- ══════ ANALYSE ══════ -->
    <div class="tool-cat" data-cat="analyse">
        <div class="tool-cat-btn" data-cat="analyse" title="Analyse">
            <svg viewBox="0 0 40 40" fill="none">
                <rect x="8" y="4" width="24" height="32" rx="2" fill="none" stroke="#ffa500" stroke-width="1.5"/>
                <text x="20" y="24" text-anchor="middle" fill="#ffa500" font-size="12" font-family="monospace" font-weight="bold">€</text>
            </svg>
            <span class="cat-label">Analyse</span>
            <span class="cat-label-big">Analyse</span>
        </div>
        <div class="tool-cat-panel" data-cat="analyse">

    <div class="tool-btn" id="btn-compter" title="Estimation des couts" data-label="Devis">
        <svg viewBox="0 0 40 40" fill="none">
            <rect x="8" y="4" width="24" height="32" rx="2" fill="#16213e" stroke="#ffa500" stroke-width="1.5"/>
            <text x="20" y="18" text-anchor="middle" fill="#ffa500" font-size="10" font-family="monospace" font-weight="bold">DEVIS</text>
            <text x="20" y="30" text-anchor="middle" fill="#43B047" font-size="10" font-family="monospace" font-weight="bold">€</text>
        </svg>
    </div>

    <div class="tool-btn" id="btn-simuler" title="Simuler la construction" data-label="Simuler">
        <svg viewBox="0 0 40 40" fill="none">
            <polygon points="12,6 34,20 12,34" fill="#43B047"/>
        </svg>
    </div>

        </div><!-- /panel analyse -->
    </div><!-- /cat analyse -->

    <!-- ══════ FICHIERS ══════ -->
    <div class="tool-cat" data-cat="fichiers">
        <div class="tool-cat-btn" data-cat="fichiers" title="Fichiers">
            <svg viewBox="0 0 40 40" fill="none">
                <rect x="6" y="6" width="28" height="28" rx="3" fill="none" stroke="#FFD700" stroke-width="2"/>
                <rect x="12" y="6" width="16" height="10" rx="1" fill="none" stroke="#FFD700" stroke-width="1"/>
                <rect x="18" y="8" width="8" height="6" rx="0.5" fill="#FFD700" fill-opacity="0.3"/>
            </svg>
            <span class="cat-label">Fichiers</span>
            <span class="cat-label-big">Fichiers</span>
        </div>
        <div class="tool-cat-panel" data-cat="fichiers">

    <div class="tool-btn" id="btn-export-menu" title="Exporter / Importer" data-label="Export">
        <svg viewBox="0 0 40 40" fill="none">
            <rect x="8" y="4" width="24" height="32" rx="2" fill="#16213e" stroke="#4a9eff" stroke-width="2"/>
            <polyline points="15,18 20,24 25,18" stroke="#4a9eff" stroke-width="2" fill="none" stroke-linecap="round"/>
            <polyline points="15,10 20,4 25,10" stroke="#43B047" stroke-width="2" fill="none" stroke-linecap="round"/>
            <line x1="12" y1="31" x2="28" y2="31" stroke="#888" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
    </div>

    <!-- Panel export/import (s'affiche au centre de l'ecran) -->
    <div id="export-panel" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:rgba(15,15,35,0.98); border:2px solid #4a9eff; border-radius:14px; padding:20px; z-index:50; min-width:380px; font-family:monospace; color:#fff; box-shadow:0 8px 40px rgba(0,0,0,0.6);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <span style="color:#4a9eff; font-weight:bold; font-size:14px; letter-spacing:1px;">EXPORTER / IMPORTER</span>
            <span id="export-panel-close" style="cursor:pointer; color:#e94560; font-size:18px; font-weight:bold;" title="Fermer">×</span>
        </div>

        <!-- Preview capture -->
        <div style="text-align:center; margin-bottom:14px; background:#111; border-radius:8px; padding:8px;">
            <canvas id="export-preview" style="max-width:100%; max-height:180px; border-radius:6px;"></canvas>
        </div>

        <div style="color:#888; font-size:10px; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Exporter</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:14px;">
            <button id="exp-json" style="padding:12px; background:#16213e; color:#ffa500; border:2px solid #ffa500; border-radius:8px; cursor:pointer; font-family:monospace; font-size:12px; font-weight:bold; transition:all 0.15s;">
                <div style="font-size:20px; margin-bottom:4px;">{ }</div>JSON<br><span style="font-size:9px; color:#888; font-weight:normal;">Projet reimportable</span>
            </button>
            <button id="exp-html" style="padding:12px; background:#16213e; color:#e94560; border:2px solid #e94560; border-radius:8px; cursor:pointer; font-family:monospace; font-size:12px; font-weight:bold; transition:all 0.15s;">
                <div style="font-size:20px; margin-bottom:4px;">&lt;/&gt;</div>HTML<br><span style="font-size:9px; color:#888; font-weight:normal;">Page web + vue 3D</span>
            </button>
            <button id="exp-pdf" style="padding:12px; background:#16213e; color:#9C27B0; border:2px solid #9C27B0; border-radius:8px; cursor:pointer; font-family:monospace; font-size:12px; font-weight:bold; transition:all 0.15s;">
                <div style="font-size:20px; margin-bottom:4px;">PDF</div>Document<br><span style="font-size:9px; color:#888; font-weight:normal;">Plan + devis + capture</span>
            </button>
            <button id="exp-photo" style="padding:12px; background:#16213e; color:#43B047; border:2px solid #43B047; border-radius:8px; cursor:pointer; font-family:monospace; font-size:12px; font-weight:bold; transition:all 0.15s;">
                <div style="font-size:20px; margin-bottom:4px;">IMG</div>Photo PNG<br><span style="font-size:9px; color:#888; font-weight:normal;">Capture haute qualite</span>
            </button>
        </div>

        <div style="color:#888; font-size:10px; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Importer</div>
        <button id="imp-json" style="width:100%; padding:10px; background:#16213e; color:#43B047; border:2px solid #43B047; border-radius:8px; cursor:pointer; font-family:monospace; font-size:12px; font-weight:bold; transition:all 0.15s;">
            Charger un projet JSON
        </button>
    </div>
    <!-- Overlay sombre -->
    <div id="export-overlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:49;"></div>

    <div id="btn-exporter" style="display:none;"></div>
    <div id="btn-importer" style="display:none;"></div>

    <!-- Enregistrer / Lire macro -->
    <div class="tool-btn" id="btn-macro-menu" title="Macro — Enregistrer / Lire" data-label="Macro" style="position:relative;">
        <svg viewBox="0 0 40 40" fill="none">
            <rect x="6" y="10" width="28" height="20" rx="3" fill="#16213e" stroke="#4a9eff" stroke-width="2"/>
            <circle cx="18" cy="20" r="6" fill="none" stroke="#4a9eff" stroke-width="1.5"/>
            <circle cx="18" cy="20" r="2.5" fill="#4a9eff"/>
            <rect x="28" y="13" width="3" height="4" rx="1" fill="#4a9eff"/>
            <rect x="28" y="23" width="3" height="4" rx="1" fill="#4a9eff"/>
            <line x1="8" y1="28" x2="12" y2="28" stroke="#e94560" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="14" y1="28" x2="18" y2="28" stroke="#43B047" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <span id="macro-rec-badge" style="display:none; position:absolute; top:-4px; right:-4px; background:#e94560; color:#fff; font-size:9px; font-family:monospace; font-weight:bold; border-radius:8px; padding:1px 4px; min-width:14px; text-align:center; border:1px solid #fff;">0</span>
    </div>
    <!-- Sous-menu macro (apparait au clic) -->
    <div id="macro-submenu" style="display:none; position:fixed; background:rgba(26,26,46,0.95); border:1px solid #4a9eff; border-radius:8px; padding:4px 0; z-index:30; min-width:200px; font-family:monospace; font-size:12px;">
        <div class="ctx-item" id="btn-macro-rec" style="display:flex; align-items:center; gap:8px; padding:8px 14px; cursor:pointer; color:#fff;">
            <svg viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="8" r="6" fill="#e94560"/></svg>
            <span>Enregistrer</span>
        </div>
        <div class="ctx-item" id="btn-macro-play" style="display:flex; align-items:center; gap:8px; padding:8px 14px; cursor:pointer; color:#fff;">
            <svg viewBox="0 0 16 16" width="16" height="16"><polygon points="3,1 14,8 3,15" fill="#43B047"/></svg>
            <span>Lire</span>
        </div>
        <div style="border-top:1px solid #333; margin:2px 8px;"></div>
        <div class="ctx-item" id="btn-macro-export-menu" style="display:flex; align-items:center; gap:8px; padding:8px 14px; cursor:pointer; color:#fff;">
            <svg viewBox="0 0 16 16" width="16" height="16"><rect x="3" y="1" width="10" height="14" rx="1" fill="none" stroke="#4a9eff" stroke-width="1.5"/><polyline points="5,9 8,12 11,9" stroke="#4a9eff" stroke-width="1.5" fill="none" stroke-linecap="round"/><line x1="8" y1="5" x2="8" y2="11" stroke="#4a9eff" stroke-width="1.5" stroke-linecap="round"/></svg>
            <span>Exporter macro</span>
        </div>
        <div class="ctx-item" id="btn-macro-import-menu" style="display:flex; align-items:center; gap:8px; padding:8px 14px; cursor:pointer; color:#fff;">
            <svg viewBox="0 0 16 16" width="16" height="16"><rect x="3" y="1" width="10" height="14" rx="1" fill="none" stroke="#43B047" stroke-width="1.5"/><polyline points="5,7 8,4 11,7" stroke="#43B047" stroke-width="1.5" fill="none" stroke-linecap="round"/><line x1="8" y1="5" x2="8" y2="11" stroke="#43B047" stroke-width="1.5" stroke-linecap="round"/></svg>
            <span>Importer macro</span>
        </div>
    </div>

    <!-- Bouton Sauvegardes (slots FF7) -->
    <div class="tool-btn" id="btn-saves" title="Sauvegardes" data-label="Sauvegardes">
        <svg viewBox="0 0 40 40" fill="none">
            <rect x="6" y="6" width="28" height="28" rx="3" fill="#16213e" stroke="#FFD700" stroke-width="2"/>
            <rect x="12" y="6" width="16" height="10" rx="1" fill="#1a1a2e" stroke="#FFD700" stroke-width="1"/>
            <rect x="18" y="8" width="8" height="6" rx="0.5" fill="#FFD700" fill-opacity="0.3"/>
            <rect x="10" y="22" width="20" height="8" rx="1" fill="#FFD700" fill-opacity="0.1" stroke="#FFD700" stroke-width="0.5"/>
        </svg>
    </div>

    <!-- Bouton Historique Global -->
    <div class="tool-btn" id="btn-timeline" title="Historique Global" data-label="Historique">
        <svg viewBox="0 0 40 40" fill="none">
            <line x1="6" y1="20" x2="34" y2="20" stroke="#9C27B0" stroke-width="2"/>
            <circle cx="11" cy="20" r="3" fill="#CE93D8"/>
            <circle cx="20" cy="20" r="3" fill="#9C27B0"/>
            <circle cx="29" cy="20" r="3" fill="#7B1FA2"/>
            <path d="M18 12 L22 12 L22 16" stroke="#CE93D8" stroke-width="1.5" fill="none" stroke-linecap="round"/>
            <path d="M20 8 L20 12" stroke="#CE93D8" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
    </div>

        </div><!-- /panel fichiers -->
    </div><!-- /cat fichiers -->

    <!-- ══════ VUE ══════ -->
    <div class="tool-cat" data-cat="vue">
        <div class="tool-cat-btn" data-cat="vue" title="Vue & Affichage">
            <svg viewBox="0 0 40 40" fill="none">
                <ellipse cx="20" cy="20" rx="14" ry="9" fill="none" stroke="#fff" stroke-width="2"/>
                <circle cx="20" cy="20" r="5" fill="#fff"/>
                <circle cx="20" cy="20" r="2" fill="#16213e"/>
            </svg>
            <span class="cat-label">Vue</span>
            <span class="cat-label-big">Vue</span>
        </div>
        <div class="tool-cat-panel" data-cat="vue">

    <!-- Bouton visibilite -->
    <div class="tool-btn" id="btn-visibilite" title="Visibilite des elements" data-label="Visibilite">
        <svg viewBox="0 0 40 40" fill="none">
            <ellipse cx="20" cy="20" rx="14" ry="9" fill="none" stroke="#fff" stroke-width="2"/>
            <circle cx="20" cy="20" r="5" fill="#fff"/>
            <circle cx="20" cy="20" r="2" fill="#16213e"/>
        </svg>
    </div>

    <!-- Popup visibilite -->
    <div id="visibilite-popup" class="popup" style="display:none; border-color:#fff; width:240px; max-height:80vh; overflow-y:auto;">
        <label class="popup-title" style="color:#fff;">Visibilite</label>

        <!-- Panneau etages (genere dynamiquement) -->
        <div id="vis-etages" style="display:none; margin-bottom:6px; padding-bottom:6px; border-bottom:1px solid #444;"></div>

        <div id="vis-liste" style="display:flex; flex-direction:column; gap:2px;"></div>
        <div style="border-top:1px solid #333; margin-top:4px; padding-top:4px; display:flex; gap:6px;">
            <button id="vis-tout" style="flex:1; padding:4px; background:#16213e; color:#43B047; border:1px solid #43B047; border-radius:3px; cursor:pointer; font-family:monospace; font-size:10px;">Tout</button>
            <button id="vis-rien" style="flex:1; padding:4px; background:#16213e; color:#e94560; border:1px solid #e94560; border-radius:3px; cursor:pointer; font-family:monospace; font-size:10px;">Rien</button>
        </div>
    </div>

    <!-- Bouton recentrer camera -->
    <div class="tool-btn" id="btn-recentrer" title="Recentrer la camera" data-label="Centrer">
        <svg viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="12" fill="none" stroke="#fff" stroke-width="2"/>
            <circle cx="20" cy="20" r="3" fill="#fff"/>
            <line x1="20" y1="4" x2="20" y2="12" stroke="#fff" stroke-width="1.5"/>
            <line x1="20" y1="28" x2="20" y2="36" stroke="#fff" stroke-width="1.5"/>
            <line x1="4" y1="20" x2="12" y2="20" stroke="#fff" stroke-width="1.5"/>
            <line x1="28" y1="20" x2="36" y2="20" stroke="#fff" stroke-width="1.5"/>
        </svg>
    </div>

    <!-- Bouton vue 2D/3D -->
    <div class="tool-btn" id="btn-vue2d" title="Basculer vue 2D / 3D" data-label="2D/3D">
        <svg viewBox="0 0 40 40" fill="none">
            <text x="20" y="26" text-anchor="middle" fill="#4a9eff" font-size="16" font-family="monospace" font-weight="bold">2D</text>
        </svg>
    </div>

    <!-- Bouton plan detaille -->
    <div class="tool-btn" id="btn-plan" title="Plan 2D detaille" data-label="Plan">
        <svg viewBox="0 0 40 40" fill="none">
            <rect x="6" y="4" width="28" height="32" rx="2" fill="#16213e" stroke="#00ccff" stroke-width="1.5"/>
            <line x1="10" y1="10" x2="30" y2="10" stroke="#00ccff" stroke-width="1.5"/>
            <line x1="10" y1="10" x2="10" y2="30" stroke="#00ccff" stroke-width="1.5"/>
            <line x1="10" y1="30" x2="30" y2="30" stroke="#00ccff" stroke-width="1.5"/>
            <line x1="30" y1="10" x2="30" y2="30" stroke="#00ccff" stroke-width="1.5"/>
            <line x1="18" y1="30" x2="22" y2="30" stroke="#16213e" stroke-width="2"/>
            <text x="20" y="23" text-anchor="middle" fill="#888" font-size="7" font-family="monospace">m²</text>
        </svg>
    </div>

    <!-- Bouton zones / pieces fermees -->
    <div class="tool-btn" id="btn-zones" title="Detecter pieces fermees / Zones" data-label="Zones">
        <svg viewBox="0 0 40 40" fill="none">
            <rect x="4" y="8" width="14" height="12" rx="1" fill="none" stroke="#FF9800" stroke-width="2"/>
            <rect x="22" y="8" width="14" height="12" rx="1" fill="none" stroke="#4CAF50" stroke-width="2"/>
            <rect x="4" y="24" width="14" height="12" rx="1" fill="none" stroke="#2196F3" stroke-width="2"/>
            <rect x="22" y="24" width="14" height="12" rx="1" fill="none" stroke="#9C27B0" stroke-width="2"/>
            <rect x="6" y="10" width="10" height="8" rx="0" fill="#FF9800" fill-opacity="0.3"/>
            <rect x="24" y="10" width="10" height="8" rx="0" fill="#4CAF50" fill-opacity="0.3"/>
            <rect x="6" y="26" width="10" height="8" rx="0" fill="#2196F3" fill-opacity="0.3"/>
            <rect x="24" y="26" width="10" height="8" rx="0" fill="#9C27B0" fill-opacity="0.3"/>
        </svg>
    </div>

    <!-- Bouton surface piece -->
    <div class="tool-btn" id="btn-surface-piece" title="Surface d'une piece (au sol) — Loi Carrez" data-label="Surface m²" style="border-color:#FFD700;">
        <svg viewBox="0 0 40 40" fill="none">
            <rect x="6" y="8" width="28" height="24" rx="2" fill="none" stroke="#FFD700" stroke-width="2"/>
            <text x="20" y="24" text-anchor="middle" font-size="11" font-weight="bold" fill="#FFD700" font-family="monospace">m²</text>
        </svg>
    </div>

    <!-- Bouton plateau -->
    <div class="tool-btn" id="btn-plateau" title="Regler le plateau" data-label="Plateau">
        <svg viewBox="0 0 40 40" fill="none">
            <rect x="4" y="22" width="32" height="4" rx="1" fill="#888"/>
            <line x1="4" y1="22" x2="20" y2="10" stroke="#888" stroke-width="2"/>
            <line x1="36" y1="22" x2="20" y2="10" stroke="#888" stroke-width="2"/>
            <line x1="4" y1="26" x2="20" y2="38" stroke="#555" stroke-width="1.5"/>
            <line x1="36" y1="26" x2="20" y2="38" stroke="#555" stroke-width="1.5"/>
            <line x1="12" y1="16" x2="28" y2="16" stroke="#aaa" stroke-width="1" stroke-dasharray="2,2"/>
            <line x1="12" y1="30" x2="28" y2="30" stroke="#666" stroke-width="1" stroke-dasharray="2,2"/>
        </svg>
    </div>

        </div><!-- /panel vue -->
    </div><!-- /cat vue -->

    <!-- Reinitialiser toujours visible -->
    <div class="tool-btn" id="btn-reinitialiser" title="Tout effacer — reinitialiser la scene" data-label="Effacer" style="border-color:#e94560;">
        <svg viewBox="0 0 40 40" fill="none">
            <path d="M12 14 L28 14 L26 32 L14 32 Z" fill="none" stroke="#e94560" stroke-width="2"/>
            <line x1="10" y1="14" x2="30" y2="14" stroke="#e94560" stroke-width="2.5"/>
            <line x1="17" y1="10" x2="23" y2="10" stroke="#e94560" stroke-width="2"/>
            <line x1="18" y1="18" x2="18" y2="28" stroke="#e94560" stroke-width="1.5"/>
            <line x1="22" y1="18" x2="22" y2="28" stroke="#e94560" stroke-width="1.5"/>
        </svg>
    </div>

    <!-- Bouton tests -->
    <div class="tool-btn" id="btn-run-tests" title="Lancer les tests automatiques" data-label="Tests" style="border-color:#43B047;">
        <svg viewBox="0 0 40 40" fill="none">
            <polygon points="12,8 34,20 12,32" fill="#43B047" stroke="#2E7D32" stroke-width="1.5"/>
        </svg>
    </div>
</div>

<!-- Popup zone (clic sur piece fermee) -->
<div id="zone-popup" style="display:none; position:fixed; background:rgba(26,26,46,0.95); border:1px solid #FF9800; border-radius:8px; padding:8px 0; z-index:30; min-width:240px; font-family:monospace; font-size:12px; color:#fff;">
    <div style="padding:6px 14px; border-bottom:1px solid #333; display:flex; justify-content:space-between; align-items:center;">
        <span style="font-weight:bold; color:#FF9800;">Assigner une zone</span>
        <span style="color:#888; font-size:10px;" id="zone-surface">0 m²</span>
    </div>
    <div style="padding:4px 14px; color:#888; font-size:10px;">Zone actuelle : <span id="zone-actuelle">Aucune</span></div>

    <!-- Nom + couleur personnalises -->
    <div style="padding:6px 14px; border-bottom:1px solid #333;">
        <div style="display:flex; gap:6px; align-items:center; margin-bottom:6px;">
            <input type="text" id="zone-nom-input" placeholder="Nom de la zone..." style="flex:1; padding:5px 8px; background:#16213e; color:#fff; border:1px solid #444; border-radius:4px; font-family:monospace; font-size:12px;">
            <input type="color" id="zone-couleur-input" value="#FF9800" style="width:34px; height:30px; padding:1px; border:1px solid #444; border-radius:4px; cursor:pointer; background:#16213e;">
        </div>
        <div style="display:flex; gap:6px;">
            <button id="zone-appliquer-btn" style="flex:1; padding:5px; background:#FF9800; color:#fff; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:11px; font-weight:bold;">Appliquer</button>
            <button id="zone-retirer-btn" style="padding:5px 10px; background:transparent; color:#e94560; border:1px solid #e94560; border-radius:4px; cursor:pointer; font-family:monospace; font-size:11px;">Retirer</button>
        </div>
    </div>

    <!-- Presets rapides -->
    <div style="padding:4px 14px 2px; color:#666; font-size:9px; text-transform:uppercase; letter-spacing:1px;">Presets</div>
    <div id="zone-liste" style="max-height:250px; overflow-y:auto;"></div>
</div>

<!-- Panel zones detectees (a droite) -->
<div id="zones-panel" style="display:none; position:fixed; top:70px; right:15px; background:rgba(26,26,46,0.95); border:1px solid #FF9800; border-radius:8px; padding:10px; z-index:10; width:240px; font-family:monospace; font-size:11px; color:#fff; max-height:50vh; overflow-y:auto;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <span style="color:#FF9800; font-weight:bold; font-size:12px;">Pieces detectees</span>
        <span id="zones-panel-count" style="color:#888; font-size:10px;">0</span>
    </div>
    <div id="zones-panel-liste"></div>
</div>

<!-- Popup plateau -->
<div id="plateau-popup" class="popup" style="display:none; border-color:#888;">
    <label class="popup-title" style="color:#aaa;">Reglages du plateau</label>

    <div class="popup-row">
        <div><label>Largeur (cases)</label><input type="number" id="plat-x" value="40" min="5" max="200" step="5"></div>
        <div><label>Profondeur (cases)</label><input type="number" id="plat-z" value="40" min="5" max="200" step="5"></div>
    </div>
    <div class="popup-row">
        <div><label>Taille case (m)</label><input type="number" id="plat-taille" value="1" min="0.5" max="5" step="0.5"></div>
    </div>

    <button id="btn-plat-appliquer" style="width:100%; margin-top:8px; padding:6px; background:#555; color:#fff; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:12px; font-weight:bold;">Appliquer taille</button>

    <div class="popup-row" style="margin-top:10px;">
        <div><label>Couleur sol</label><input type="color" id="plat-sol-couleur" value="#555555"></div>
        <div><label>Couleur ciel</label><input type="color" id="plat-ciel-couleur" value="#87CEEB"></div>
    </div>

    <div class="popup-row">
        <div><label>Soleil</label><input type="range" id="plat-soleil" min="0" max="200" value="100" style="width:100%;"></div>
    </div>
</div>

<!-- Sous-menu directions (grille 3x3) -->
<div id="dir-menu">
    <div class="dir-grid">
        <!-- Ligne 1 : carre-diag135, mur-diag315(315), mur-haut(270), mur-diag45(45), carre-diag45 -->
        <div class="dir-btn" id="btn-carre-od" title="Carre diagonal 135">
            <svg viewBox="0 0 40 40" fill="none">
                <polygon points="20,4 36,20 20,36 4,20" fill="none" stroke="#8B4513" stroke-width="3.5"/>
                <polygon points="20,8 32,20 20,32 8,20" fill="none" stroke="#A0522D" stroke-width="2"/>
                <polygon points="4,14 4,6 12,6" fill="#43B047"/>
            </svg>
        </div>
        <div class="dir-btn" id="btn-mur-315" title="Mur 315">
            <svg viewBox="0 0 40 40" fill="none">
                <line x1="30" y1="6" x2="10" y2="34" stroke="#8B4513" stroke-width="5" stroke-linecap="round"/>
                <line x1="32" y1="8" x2="12" y2="36" stroke="#A0522D" stroke-width="3" stroke-linecap="round"/>
                <polygon points="32,4 36,2 34,10" fill="#43B047"/>
            </svg>
        </div>
        <div class="dir-btn" id="btn-mur-h" title="Haut (270)">
            <svg viewBox="0 0 40 40" fill="none">
                <rect x="14" y="3" width="4" height="34" rx="1" fill="#8B4513"/>
                <rect x="22" y="3" width="4" height="34" rx="1" fill="#A0522D"/>
                <polygon points="8,6 13,0 18,6" fill="#43B047"/>
                <line x1="13" y1="6" x2="13" y2="34" stroke="#43B047" stroke-width="2"/>
            </svg>
        </div>
        <div class="dir-btn" id="btn-mur-45" title="Mur 45">
            <svg viewBox="0 0 40 40" fill="none">
                <line x1="10" y1="6" x2="30" y2="34" stroke="#8B4513" stroke-width="5" stroke-linecap="round"/>
                <line x1="8" y1="8" x2="28" y2="36" stroke="#A0522D" stroke-width="3" stroke-linecap="round"/>
                <polygon points="8,4 4,2 6,10" fill="#43B047"/>
            </svg>
        </div>
        <div class="dir-btn" id="btn-carre-og" title="Carre diagonal 45">
            <svg viewBox="0 0 40 40" fill="none">
                <polygon points="20,4 36,20 20,36 4,20" fill="none" stroke="#8B4513" stroke-width="3.5"/>
                <polygon points="20,8 32,20 20,32 8,20" fill="none" stroke="#A0522D" stroke-width="2"/>
                <polygon points="28,6 36,6 36,14" fill="#43B047"/>
            </svg>
        </div>

        <!-- Ligne 2 : gauche, mur-diag225, carre, mur-diag135, droite -->
        <div class="dir-btn" id="btn-mur-g" title="Gauche (180)">
            <svg viewBox="0 0 40 40" fill="none">
                <rect x="3" y="16" width="34" height="4" rx="1" fill="#8B4513"/>
                <rect x="3" y="21" width="34" height="4" rx="1" fill="#A0522D"/>
                <polygon points="6,8 0,13 6,18" fill="#43B047"/>
                <line x1="6" y1="13" x2="34" y2="13" stroke="#43B047" stroke-width="2"/>
            </svg>
        </div>
        <div class="dir-btn" id="btn-mur-225" title="Mur 225">
            <svg viewBox="0 0 40 40" fill="none">
                <line x1="10" y1="6" x2="30" y2="34" stroke="#8B4513" stroke-width="5" stroke-linecap="round"/>
                <line x1="8" y1="8" x2="28" y2="36" stroke="#A0522D" stroke-width="3" stroke-linecap="round"/>
                <polygon points="32,36 36,38 34,30" fill="#43B047"/>
            </svg>
        </div>
        <div class="dir-btn" id="btn-mur-carre" title="Carre (4 murs)">
            <svg viewBox="0 0 40 40" fill="none">
                <rect x="6" y="6" width="28" height="28" rx="1" fill="none" stroke="#8B4513" stroke-width="4"/>
                <rect x="8" y="8" width="24" height="24" rx="1" fill="none" stroke="#A0522D" stroke-width="2"/>
            </svg>
        </div>
        <div class="dir-btn" id="btn-mur-135" title="Mur 135">
            <svg viewBox="0 0 40 40" fill="none">
                <line x1="30" y1="6" x2="10" y2="34" stroke="#8B4513" stroke-width="5" stroke-linecap="round"/>
                <line x1="32" y1="8" x2="12" y2="36" stroke="#A0522D" stroke-width="3" stroke-linecap="round"/>
                <polygon points="8,36 4,38 6,30" fill="#43B047"/>
            </svg>
        </div>
        <div class="dir-btn" id="btn-mur-d" title="Droite (0)">
            <svg viewBox="0 0 40 40" fill="none">
                <rect x="3" y="16" width="34" height="4" rx="1" fill="#8B4513"/>
                <rect x="3" y="21" width="34" height="4" rx="1" fill="#A0522D"/>
                <polygon points="34,8 40,13 34,18" fill="#43B047"/>
                <line x1="6" y1="13" x2="34" y2="13" stroke="#43B047" stroke-width="2"/>
            </svg>
        </div>

        <!-- Ligne 3 : carre-diag225, mur-diag(135 bas), mur-bas(90), mur-diag(225 bas), carre-diag315 -->
        <div class="dir-btn" id="btn-carre-og2" title="Carre diagonal 225">
            <svg viewBox="0 0 40 40" fill="none">
                <polygon points="20,4 36,20 20,36 4,20" fill="none" stroke="#8B4513" stroke-width="3.5"/>
                <polygon points="20,8 32,20 20,32 8,20" fill="none" stroke="#A0522D" stroke-width="2"/>
                <polygon points="4,26 4,34 12,34" fill="#43B047"/>
            </svg>
        </div>
        <div class="dir-vide"></div>
        <div class="dir-btn" id="btn-mur-v" title="Bas (90)">
            <svg viewBox="0 0 40 40" fill="none">
                <rect x="14" y="3" width="4" height="34" rx="1" fill="#8B4513"/>
                <rect x="22" y="3" width="4" height="34" rx="1" fill="#A0522D"/>
                <polygon points="8,34 13,40 18,34" fill="#43B047"/>
                <line x1="13" y1="6" x2="13" y2="34" stroke="#43B047" stroke-width="2"/>
            </svg>
        </div>
        <div class="dir-vide"></div>
        <div class="dir-btn" id="btn-carre-od2" title="Carre diagonal 315">
            <svg viewBox="0 0 40 40" fill="none">
                <polygon points="20,4 36,20 20,36 4,20" fill="none" stroke="#8B4513" stroke-width="3.5"/>
                <polygon points="20,8 32,20 20,32 8,20" fill="none" stroke="#A0522D" stroke-width="2"/>
                <polygon points="28,34 36,34 36,26" fill="#43B047"/>
            </svg>
        </div>
    </div>
</div>

<!-- Popup parametres mur -->
<div id="params-popup" class="popup">
    <label>Type</label>
    <select id="f-type">
        <option value="mur">Mur droit</option>
        <option value="carre">Carre</option>
    </select>

    <label>Brique</label>
    <select id="f-brique-type">
        <option value="standard">Standard (22x6.5x11cm)</option>
        <option value="pleine">Pleine (21.5x6.5x10.5cm)</option>
        <option value="creuse">Creuse (20x25x50cm)</option>
        <option value="platriere">Platriere (40x20x5cm)</option>
        <option value="parpaing">Parpaing (20x20x50cm)</option>
        <option value="beton_cell">Beton cellulaire (25x20x60cm)</option>
        <option value="monomur">Monomur (30x25x50cm)</option>
        <option value="pierre">Pierre de taille (40x20x20cm)</option>
    </select>

    <div class="popup-row">
        <div><label>Longueur (m)</label><input type="number" id="f-distance" value="5" step="0.5" min="0.5"></div>
        <div><label>Hauteur (m)</label><input type="number" id="f-hauteur" value="2.50" step="0.25" min="0.5"></div>
    </div>
    <div id="zone-largeur" class="popup-row" style="display:none; margin-top:2px;">
        <div><label style="color:#FFD700;">Largeur (m)</label><input type="number" id="f-largeur" value="5" step="0.5" min="0.5" style="color:#FFD700;"></div>
    </div>
    <div class="popup-row" style="margin-top:2px;">
        <div><label>Surface mur (m²)</label><input type="number" id="f-surface" value="12.50" step="0.5" min="0.1" style="color:#43B047;"></div>
        <div><label style="color:#FFD700;">Surface au sol (m²)</label><input type="number" id="f-surface-au-sol" value="" step="0.5" min="0.1" style="color:#FFD700; font-weight:bold;" placeholder="ex: 20"></div>
    </div>
    <div class="popup-row" style="margin-top:2px;">
        <div><label style="color:#ff6b6b;">Surface habitable (m²)</label><input type="number" id="f-surface-habitable" value="" step="0.5" min="0.1" style="color:#ff6b6b; font-weight:bold;" placeholder="ex: 18"></div>
    </div>
    <div class="popup-row" style="margin-top:2px;">
        <div id="zone-surface-sol" style="display:none;"><label>Surface sol brute (m²)</label><input type="number" id="f-surface-sol" value="25" step="1" min="0.1" style="color:#ffa500;"></div>
    </div>
    <div id="zone-surface-piece" style="display:none; margin-top:4px; padding:8px; background:rgba(255,215,0,0.15); border:2px solid #FFD700; border-radius:6px; text-align:center;">
        <label style="color:#FFD700; font-size:11px; font-weight:bold;">Surface d'une piece (au sol)</label>
        <div style="display:flex; gap:6px; align-items:center; justify-content:center; margin-top:4px;">
            <span id="f-surface-piece-calcul" style="color:#aaa; font-size:10px;"></span>
        </div>
        <input type="number" id="f-surface-piece" value="0" step="0.1" min="0" readonly style="color:#FFD700; font-weight:bold; background:rgba(0,0,0,0.3); border:1px solid #FFD700; border-radius:4px; font-size:18px; text-align:center; width:100%; padding:6px; margin-top:4px;">
        <div style="color:#aaa; font-size:9px; margin-top:2px;">Loi Carrez — epaisseur murs deduite</div>
    </div>

    <div id="zone-angle" style="display:none;">
        <label>Angle</label>
        <select id="f-angle">
            <option value="0">0 — droite</option>
            <option value="45">45</option>
            <option value="90">90 — profondeur</option>
            <option value="135">135</option>
            <option value="180">180 — gauche</option>
            <option value="225">225</option>
            <option value="270">270 — devant</option>
            <option value="315">315</option>
        </select>
    </div>

    <div id="zone-cotes" style="display:none;">
        <label>Cotes</label>
        <select id="f-nbcotes">
            <option value="4">4 — carre</option>
            <option value="3">3 — U</option>
            <option value="2">2 — L</option>
        </select>
    </div>

    <label>Pas de la grille (m)</label>
    <input type="number" id="f-grille" value="0" step="0.01" min="0">

    <div class="popup-row">
        <div><label>Briques</label><input type="color" id="f-couleur" value="#8B4513"></div>
        <div><label>%</label><input type="number" id="f-opacite" min="0" max="100" value="100" step="5"></div>
    </div>
    <div class="popup-row">
        <div><label>Joints</label><input type="color" id="f-joint" value="#C8C0B8"></div>
        <div><label>%</label><input type="number" id="f-opacite-joint" min="0" max="100" value="100" step="5"></div>
    </div>
    <button id="btn-couleur-tous" style="width:100%; margin-top:6px; padding:5px; background:#4a9eff; color:#fff; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:11px;">Appliquer couleur a tous les murs</button>

    <div style="border-top:1px solid #333; margin-top:8px; padding-top:6px;">
        <label><input type="checkbox" id="f-bicolore"> Bicolore (2 couleurs alternees)</label>
        <div id="zone-bicolore" style="display:none;">
            <div class="popup-row">
                <div><label>Couleur 2</label><input type="color" id="f-couleur2" value="#CC6633"></div>
                <div><label>%</label><input type="number" id="f-opacite2" min="0" max="100" value="100" step="5"></div>
            </div>
        </div>
    </div>

    <input type="hidden" id="f-x" value="0">
    <input type="hidden" id="f-y" value="0">
    <input type="hidden" id="f-z" value="0">
</div>

<!-- Popup parametres trou -->
<div id="trou-popup" class="popup" style="border-color:#e94560;">
    <label class="popup-title" style="color:#e94560;">Percer un trou</label>

    <div class="popup-row" style="margin-bottom:8px;">
        <button id="btn-preset-porte" class="preset-btn preset-actif" style="flex:1; padding:5px; background:#e94560; color:#fff; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:11px;">Porte</button>
        <button id="btn-preset-fenetre" class="preset-btn" style="flex:1; padding:5px; background:#16213e; color:#aaa; border:1px solid #333; border-radius:4px; cursor:pointer; font-family:monospace; font-size:11px;">Fenetre</button>
    </div>

    <div class="popup-row">
        <div><label>Largeur</label><input type="number" id="f-trou-largeur" value="0.90" step="0.05" min="0.1"></div>
        <div><label>Hauteur</label><input type="number" id="f-trou-hauteur" value="2.10" step="0.05" min="0.1"></div>
    </div>

    <label>Position Y (depuis le sol)</label>
    <input type="number" id="f-trou-y" value="0" step="0.05" min="0">

    <label>Alignement</label>
    <select id="f-trou-align">
        <option value="click" selected>Position du clic</option>
        <option value="center">Centre du mur</option>
        <option value="start">Debut du mur</option>
        <option value="end">Fin du mur</option>
    </select>

    <label>Decalage</label>
    <input type="number" id="f-trou-decalage" value="0" step="0.05">

    <p style="color:#666; font-size:10px; margin-top:8px;">Cliquez sur un mur existant.</p>
</div>

<!-- Popup edition mur -->
<div id="edit-popup" class="popup" style="border-color:#ffa500;">
    <label class="popup-title" style="color:#ffa500;">Editer le mur</label>
    <span id="edit-mur-nom" style="color:#888; font-size:10px;"></span>

    <label>Brique</label>
    <select id="e-brique-type">
        <option value="standard">Standard (22x6.5x11cm)</option>
        <option value="pleine">Pleine (21.5x6.5x10.5cm)</option>
        <option value="creuse">Creuse (20x25x50cm)</option>
        <option value="platriere">Platriere (40x20x5cm)</option>
        <option value="parpaing">Parpaing (20x20x50cm)</option>
        <option value="beton_cell">Beton cellulaire (25x20x60cm)</option>
        <option value="monomur">Monomur (30x25x50cm)</option>
        <option value="pierre">Pierre de taille (40x20x20cm)</option>
    </select>

    <div class="popup-row">
        <div><label>Distance</label><input type="number" id="e-distance" step="0.5" min="0.5"></div>
        <div><label>Hauteur</label><input type="number" id="e-hauteur" step="0.25" min="0.5"></div>
    </div>

    <label>Angle</label>
    <div style="display:flex; gap:3px; flex-wrap:wrap; margin-bottom:6px;">
        <button class="e-angle-btn" data-angle="0" style="flex:1; padding:4px; background:#16213e; color:#fff; border:1px solid #333; border-radius:3px; cursor:pointer; font-family:monospace; font-size:10px;">0</button>
        <button class="e-angle-btn" data-angle="45" style="flex:1; padding:4px; background:#16213e; color:#fff; border:1px solid #333; border-radius:3px; cursor:pointer; font-family:monospace; font-size:10px;">45</button>
        <button class="e-angle-btn" data-angle="90" style="flex:1; padding:4px; background:#16213e; color:#fff; border:1px solid #333; border-radius:3px; cursor:pointer; font-family:monospace; font-size:10px;">90</button>
        <button class="e-angle-btn" data-angle="135" style="flex:1; padding:4px; background:#16213e; color:#fff; border:1px solid #333; border-radius:3px; cursor:pointer; font-family:monospace; font-size:10px;">135</button>
        <button class="e-angle-btn" data-angle="180" style="flex:1; padding:4px; background:#16213e; color:#fff; border:1px solid #333; border-radius:3px; cursor:pointer; font-family:monospace; font-size:10px;">180</button>
        <button class="e-angle-btn" data-angle="225" style="flex:1; padding:4px; background:#16213e; color:#fff; border:1px solid #333; border-radius:3px; cursor:pointer; font-family:monospace; font-size:10px;">225</button>
        <button class="e-angle-btn" data-angle="270" style="flex:1; padding:4px; background:#16213e; color:#fff; border:1px solid #333; border-radius:3px; cursor:pointer; font-family:monospace; font-size:10px;">270</button>
        <button class="e-angle-btn" data-angle="315" style="flex:1; padding:4px; background:#16213e; color:#fff; border:1px solid #333; border-radius:3px; cursor:pointer; font-family:monospace; font-size:10px;">315</button>
    </div>
    <input type="number" id="e-angle" step="1" min="0" max="359" style="margin-bottom:6px;">

    <div class="popup-row">
        <div><label>Briques</label><input type="color" id="e-couleur"></div>
        <div><label>%</label><input type="number" id="e-opacite" min="0" max="100" step="5"></div>
    </div>
    <div class="popup-row">
        <div><label>Joints</label><input type="color" id="e-joint"></div>
        <div><label>%</label><input type="number" id="e-opacite-joint" min="0" max="100" step="5"></div>
    </div>

    <button id="btn-edit-appliquer" style="width:100%; margin-top:8px; padding:6px; background:#ffa500; color:#000; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:12px; font-weight:bold;">Appliquer</button>
    <button id="btn-edit-degrouper" style="width:100%; margin-top:4px; padding:6px; background:#43B047; color:#fff; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:12px; display:none;">Degrouper ce mur</button>
    <button id="btn-edit-supprimer" style="width:100%; margin-top:4px; padding:6px; background:#e94560; color:#fff; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:12px;">Supprimer ce mur</button>
</div>

<!-- Panel Sauvegardes (style FF7) -->
<div id="saves-overlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:60;"></div>
<div id="saves-panel" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:linear-gradient(180deg, #0a0a1e 0%, #141432 100%); border:2px solid #FFD700; border-radius:14px; padding:20px; z-index:61; width:520px; max-height:85vh; overflow-y:auto; font-family:monospace; color:#fff; box-shadow:0 0 40px rgba(255,215,0,0.15), inset 0 0 60px rgba(0,0,0,0.3);">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <div style="display:flex; gap:0;">
            <button id="saves-tab-save" style="padding:8px 18px; background:#FFD700; color:#000; border:none; border-radius:6px 0 0 6px; cursor:pointer; font-family:monospace; font-size:12px; font-weight:bold;">SAUVEGARDER</button>
            <button id="saves-tab-load" style="padding:8px 18px; background:#16213e; color:#43B047; border:1px solid #43B047; border-left:none; border-radius:0 6px 6px 0; cursor:pointer; font-family:monospace; font-size:12px; font-weight:bold;">CHARGER</button>
        </div>
        <div style="display:flex; gap:4px;">
            <button id="saves-tab-clear-scene" style="padding:6px 10px; background:#16213e; color:#ffa500; border:1px solid #ffa500; border-radius:4px; cursor:pointer; font-family:monospace; font-size:9px; font-weight:bold;" title="Vider la scene actuelle">🗑 Scene</button>
            <button id="saves-tab-clear-all" style="padding:6px 10px; background:#16213e; color:#e94560; border:1px solid #e94560; border-radius:4px; cursor:pointer; font-family:monospace; font-size:9px; font-weight:bold;" title="Vider scene + tous les blocs">🗑 Tout</button>
            <span id="saves-close" style="cursor:pointer; color:#e94560; font-size:18px; font-weight:bold; padding:0 4px;">×</span>
        </div>
    </div>
    <div id="saves-slots"></div>
</div>

<!-- Popup confirmation suppression (corbeille) -->
<div id="confirm-delete-overlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:70;"></div>
<div id="confirm-delete-popup" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:linear-gradient(180deg, #1a0a0a 0%, #2a1020 100%); border:2px solid #e94560; border-radius:14px; padding:24px; z-index:71; width:320px; font-family:monospace; color:#fff; text-align:center; box-shadow:0 0 40px rgba(233,69,96,0.2);">
    <div style="font-size:48px; margin-bottom:12px;">🗑</div>
    <div id="confirm-delete-msg" style="font-size:13px; margin-bottom:16px; color:#ccc;"></div>
    <div id="confirm-delete-preview" style="margin-bottom:14px;"></div>
    <div style="display:flex; gap:10px; justify-content:center;">
        <button id="confirm-delete-yes" style="padding:10px 24px; background:#e94560; color:#fff; border:none; border-radius:6px; cursor:pointer; font-family:monospace; font-size:13px; font-weight:bold;">Supprimer</button>
        <button id="confirm-delete-no" style="padding:10px 24px; background:#16213e; color:#aaa; border:1px solid #444; border-radius:6px; cursor:pointer; font-family:monospace; font-size:13px;">Annuler</button>
    </div>
</div>

<!-- Plan 2D detaille -->
<div id="plan-overlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:80;">
    <div style="position:absolute; top:10px; left:50%; transform:translateX(-50%); display:flex; gap:10px; align-items:center; z-index:82;">
        <span style="color:#00ccff; font-family:monospace; font-size:14px; font-weight:bold; letter-spacing:2px;">PLAN 2D</span>
        <button id="plan-export-png" style="padding:5px 12px; background:#43B047; color:#fff; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:11px;">Exporter PNG</button>
        <button id="plan-close" style="padding:5px 12px; background:#e94560; color:#fff; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:11px; font-weight:bold;">Fermer</button>
    </div>
    <canvas id="plan-canvas" style="position:absolute; top:40px; left:0; width:100%; height:calc(100% - 40px);"></canvas>
</div>

<!-- Historique Global -->
<div id="timeline-bar" style="display:none; position:fixed; bottom:10px; left:50%; transform:translateX(-50%); z-index:15; background:linear-gradient(135deg, rgba(15,15,35,0.97), rgba(30,30,60,0.97)); border:1px solid #9C27B0; border-radius:12px; padding:10px 20px; font-family:monospace; font-size:12px; color:#fff; box-shadow:0 4px 24px rgba(156,39,176,0.3); min-width:500px;">
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
        <span style="color:#CE93D8; font-weight:bold; font-size:11px; letter-spacing:1px;">HISTORIQUE GLOBAL</span>
        <span id="tl-step" style="color:#fff; font-size:13px; font-weight:bold; min-width:70px; text-align:center;">0 / 0</span>
        <span id="tl-info" style="color:#888; font-size:10px; flex:1; text-align:right;"></span>
    </div>
    <div style="display:flex; align-items:center; gap:8px;">
        <button id="tl-start" style="padding:5px 8px; background:transparent; color:#CE93D8; border:1px solid #7B1FA2; border-radius:4px; cursor:pointer; font-size:12px;" title="Debut">⏮</button>
        <button id="tl-prev" style="padding:5px 10px; background:transparent; color:#CE93D8; border:1px solid #7B1FA2; border-radius:4px; cursor:pointer; font-size:14px; font-weight:bold;" title="Etape precedente">◀</button>
        <button id="tl-play" style="padding:5px 10px; background:#7B1FA2; color:#fff; border:none; border-radius:4px; cursor:pointer; font-size:14px;" title="Lecture auto">▶</button>
        <button id="tl-next" style="padding:5px 10px; background:transparent; color:#CE93D8; border:1px solid #7B1FA2; border-radius:4px; cursor:pointer; font-size:14px; font-weight:bold;" title="Etape suivante">▶</button>
        <button id="tl-end" style="padding:5px 8px; background:transparent; color:#CE93D8; border:1px solid #7B1FA2; border-radius:4px; cursor:pointer; font-size:12px;" title="Fin">⏭</button>
        <input type="range" id="tl-slider" min="0" max="0" value="0" style="flex:1; accent-color:#9C27B0; cursor:pointer;">
        <label style="color:#888; font-size:10px;">Vitesse</label>
        <input type="range" id="tl-speed" min="1" max="20" value="3" style="width:60px; accent-color:#9C27B0;">
        <span id="tl-speed-label" style="font-size:10px; color:#CE93D8; min-width:24px;">x3</span>
        <button id="tl-export" style="padding:5px 8px; background:#7B1FA2; color:#fff; border:none; border-radius:4px; cursor:pointer; font-size:10px; font-weight:bold;" title="Exporter l'historique">Export</button>
        <button id="tl-import" style="padding:5px 8px; background:#43B047; color:#fff; border:none; border-radius:4px; cursor:pointer; font-size:10px; font-weight:bold;" title="Importer un historique">Import</button>
        <button id="tl-close" style="padding:5px 10px; background:#e94560; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold; font-size:11px;">Fermer</button>
    </div>
</div>


<!-- Barre de controle macro -->
<div id="macro-bar" style="display:none; position:fixed; bottom:50px; left:50%; transform:translateX(-50%); z-index:10; text-align:center; background:rgba(26,26,46,0.95); border:1px solid #4a9eff; border-radius:8px; padding:8px 16px; display:none; align-items:center; gap:8px; font-family:monospace; font-size:12px; color:#fff;">
    <button id="macro-prev" style="padding:6px 10px; background:#16213e; color:#fff; border:1px solid #4a9eff; border-radius:4px; cursor:pointer; font-size:14px;" title="Etape precedente">&#9664;&#9664;</button>
    <button id="macro-pause" style="padding:6px 10px; background:#16213e; color:#fff; border:1px solid #4a9eff; border-radius:4px; cursor:pointer; font-size:14px;" title="Pause / Reprendre">&#10074;&#10074;</button>
    <button id="macro-next" style="padding:6px 10px; background:#16213e; color:#fff; border:1px solid #4a9eff; border-radius:4px; cursor:pointer; font-size:14px;" title="Etape suivante">&#9654;&#9654;</button>
    <span id="macro-step" style="margin:0 8px; min-width:60px;">0 / 0</span>
    <label style="color:#aaa; font-size:11px;">Vitesse:</label>
    <input type="range" id="macro-speed" min="1" max="20" value="5" style="width:80px; vertical-align:middle;">
    <span id="macro-speed-label" style="font-size:11px; min-width:30px;">x5</span>
    <button id="macro-stop" style="padding:6px 14px; background:#e94560; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">Stop</button>
    <button id="macro-export" style="padding:6px 10px; background:#4a9eff; color:#fff; border:none; border-radius:4px; cursor:pointer;" title="Exporter macro">Export</button>
    <button id="macro-import" style="padding:6px 10px; background:#43B047; color:#fff; border:none; border-radius:4px; cursor:pointer;" title="Importer macro">Import</button>
</div>

<div id="grouper-bar" style="display:none; position:fixed; bottom:50px; left:50%; transform:translateX(-50%); z-index:10; text-align:center;">
    <button id="btn-grouper-valider" style="padding:10px 30px; background:#43B047; color:#fff; border:none; border-radius:6px; cursor:pointer; font-family:monospace; font-size:14px; font-weight:bold; margin-right:8px;">Grouper</button>
    <button id="btn-grouper-annuler" style="padding:10px 20px; background:#e94560; color:#fff; border:none; border-radius:6px; cursor:pointer; font-family:monospace; font-size:14px;">Annuler</button>
</div>
<!-- Panel Devis / Estimation des couts -->
<div id="devis-panel" style="display:none; position:fixed; top:70px; right:15px; background:rgba(15,15,35,0.97); border:1px solid #ffa500; border-radius:10px; padding:12px; z-index:12; width:320px; font-family:monospace; font-size:11px; color:#fff; max-height:75vh; overflow-y:auto; box-shadow:0 4px 20px rgba(255,165,0,0.2);">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <span style="color:#ffa500; font-weight:bold; font-size:13px; letter-spacing:1px;">ESTIMATION DES COUTS</span>
        <span id="devis-close" style="cursor:pointer; color:#e94560; font-size:16px; font-weight:bold;" title="Fermer">×</span>
    </div>
    <div id="devis-contenu"></div>
    <div id="devis-total" style="margin-top:10px; padding:10px; border-top:2px solid #ffa500; text-align:right;"></div>
    <div style="margin-top:10px; display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:5px;">
        <button id="devis-exp-txt" style="padding:6px 4px; background:#16213e; color:#ffa500; border:1px solid #ffa500; border-radius:4px; cursor:pointer; font-family:monospace; font-size:10px; font-weight:bold;">TXT</button>
        <button id="devis-exp-pdf" style="padding:6px 4px; background:#16213e; color:#9C27B0; border:1px solid #9C27B0; border-radius:4px; cursor:pointer; font-family:monospace; font-size:10px; font-weight:bold;">PDF</button>
        <button id="devis-exp-html" style="padding:6px 4px; background:#16213e; color:#e94560; border:1px solid #e94560; border-radius:4px; cursor:pointer; font-family:monospace; font-size:10px; font-weight:bold;">HTML</button>
        <button id="devis-copier" style="padding:6px 4px; background:#16213e; color:#4a9eff; border:1px solid #4a9eff; border-radius:4px; cursor:pointer; font-family:monospace; font-size:10px; font-weight:bold;">Copier</button>
    </div>
</div>

<div id="mesures-panel">
    <div class="mesure-title">
        <span>Mesures</span>
        <span id="btn-mesures-clear" style="cursor:pointer; color:#e94560; font-size:10px;">Tout effacer</span>
    </div>
    <div id="mesures-list"></div>
</div>

<!-- Popup choix type de trou -->
<div id="trou-choix-popup" class="popup" style="display:none; border-color:#e94560; top:auto; bottom:60px; left:50%; transform:translateX(-50%); text-align:center; width:260px;">
    <label class="popup-title" style="color:#e94560;">Percer un trou</label>
    <span id="trou-choix-mur" style="color:#888; font-size:10px; display:block; margin-bottom:8px;"></span>
    <button id="btn-trou-porte" style="width:100%; padding:8px; margin-bottom:4px; background:#e94560; color:#fff; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:12px;">Porte (0.83 x 2.04m)</button>
    <button id="btn-trou-fenetre" style="width:100%; padding:8px; margin-bottom:4px; background:#e94560; color:#fff; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:12px;">Fenetre (1.20 x 1.15m, Y=0.90m)</button>
    <button id="btn-trou-rond" style="width:100%; padding:8px; margin-bottom:4px; background:#e94560; color:#fff; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:12px;">&#9711; Rond (&#8960; 0.50m)</button>
    <button id="btn-trou-custom" style="width:100%; padding:8px; margin-bottom:4px; background:#16213e; color:#fff; border:1px solid #e94560; border-radius:4px; cursor:pointer; font-family:monospace; font-size:12px;">Personnalise...</button>
    <button id="btn-trou-manuel" style="width:100%; padding:8px; margin-bottom:4px; background:#16213e; color:#aaa; border:1px solid #333; border-radius:4px; cursor:pointer; font-family:monospace; font-size:12px;">Manuel (X puis Y)</button>
    <button id="btn-trou-precis" style="width:100%; padding:8px; background:#16213e; color:#ffa500; border:1px solid #ffa500; border-radius:4px; cursor:pointer; font-family:monospace; font-size:12px;">&#9881; Precis (formulaire)</button>
</div>

<!-- Popup trou precis (etape par etape) -->
<div id="trou-precis-popup" class="popup" style="display:none; border-color:#ffa500; top:auto; bottom:60px; left:50%; transform:translateX(-50%); text-align:center; width:260px;">
    <label class="popup-title" style="color:#ffa500;">Trou precis</label>
    <span id="tp-mur-info" style="color:#888; font-size:10px; display:block; margin-bottom:8px;"></span>

    <div class="popup-row">
        <div><label>Position X (m)</label><input type="number" id="tp-x" value="0.50" step="0.05" min="0"></div>
        <div><label>Position Y (m)</label><input type="number" id="tp-y" value="0" step="0.05" min="0"></div>
    </div>
    <div class="popup-row">
        <div><label>Largeur (m)</label><input type="number" id="tp-largeur" value="0.90" step="0.05" min="0.1"></div>
        <div><label>Hauteur (m)</label><input type="number" id="tp-hauteur" value="2.10" step="0.05" min="0.1"></div>
    </div>

    <label>Forme</label>
    <div style="display:flex; gap:4px; margin-bottom:10px;">
        <button class="tp-forme-btn" data-forme="rect" style="flex:1; padding:6px; background:#e94560; color:#fff; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:11px;">&#9634; Rect</button>
        <button class="tp-forme-btn" data-forme="rond" style="flex:1; padding:6px; background:#16213e; color:#fff; border:1px solid #e94560; border-radius:4px; cursor:pointer; font-family:monospace; font-size:11px;">&#9711; Rond</button>
        <button class="tp-forme-btn" data-forme="arrondi" style="flex:1; padding:6px; background:#16213e; color:#fff; border:1px solid #e94560; border-radius:4px; cursor:pointer; font-family:monospace; font-size:11px;">&#8978; Arche</button>
    </div>

    <div style="display:flex; gap:6px;">
        <button id="btn-tp-valider" style="flex:2; padding:8px; background:#43B047; color:#fff; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:13px; font-weight:bold;">Percer</button>
        <button id="btn-tp-annuler" style="flex:1; padding:8px; background:#e94560; color:#fff; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:12px;">Annuler</button>
    </div>
</div>

<!-- Popup trou rapide -->
<div id="trou-rapide-popup" class="popup" style="display:none; border-color:#e94560; top:auto; bottom:60px; left:50%; transform:translateX(-50%); text-align:center;">
    <label class="popup-title" style="color:#e94560;">Trou rapide</label>
    <div class="popup-row">
        <div><label>Largeur (m)</label><input type="number" id="tr-largeur" value="0.90" step="0.05" min="0.1"></div>
        <div><label>Hauteur (m)</label><input type="number" id="tr-hauteur" value="2.10" step="0.05" min="0.1"></div>
    </div>
    <div class="popup-row">
        <div><label>Position X</label>
            <select id="tr-align">
                <option value="click">Position du clic</option>
                <option value="center">Centre du mur</option>
                <option value="start">Debut du mur</option>
                <option value="end">Fin du mur</option>
            </select>
        </div>
    </div>
    <div class="popup-row">
        <div><label>Position Y (m)</label><input type="number" id="tr-y" value="0" step="0.05" min="0"></div>
    </div>
    <p style="color:#aaa; font-size:10px; margin-top:6px;">Cliquez sur le mur pour percer.</p>
</div>

<div id="rotation-bar" style="display:none; position:fixed; bottom:80px; left:50%; transform:translateX(-50%); z-index:200; background:#1a1a2e; border:1px solid #00ff88; border-radius:8px; padding:6px 12px; text-align:center; font-family:monospace;">
    <button id="btn-rot-gauche" style="width:44px; height:44px; font-size:22px; background:#16213e; color:#00ff88; border:1px solid #00ff88; border-radius:6px; cursor:pointer; margin-right:8px;" title="Pivoter -15 deg (touche L)">&#8634;</button>
    <span style="color:#aaa; font-size:11px; vertical-align:middle;">R / L = pivoter 15&deg;</span>
    <button id="btn-rot-droite" style="width:44px; height:44px; font-size:22px; background:#16213e; color:#00ff88; border:1px solid #00ff88; border-radius:6px; cursor:pointer; margin-left:8px;" title="Pivoter +15 deg (touche R)">&#8635;</button>
</div>
<!-- Barre controle simulation -->
<div id="sim-bar" style="display:none; position:fixed; bottom:60px; left:50%; transform:translateX(-50%); z-index:200; background:#1a1a2e; border:1px solid #43B047; border-radius:8px; padding:8px 16px; text-align:center; font-family:monospace;">
    <button id="sim-pause" style="width:36px; height:36px; font-size:18px; background:#16213e; color:#43B047; border:1px solid #43B047; border-radius:6px; cursor:pointer; margin-right:6px;" title="Pause / Reprendre">&#9646;&#9646;</button>
    <button id="sim-stop" style="width:36px; height:36px; font-size:18px; background:#16213e; color:#e94560; border:1px solid #e94560; border-radius:6px; cursor:pointer; margin-right:12px;" title="Arreter">&#9632;</button>
    <label style="color:#aaa; font-size:11px;">Vitesse</label>
    <input type="range" id="sim-vitesse" min="1" max="100" value="20" style="width:100px; vertical-align:middle; margin:0 8px;">
    <span id="sim-compteur" style="color:#43B047; font-size:12px; min-width:120px; display:inline-block;">0 / 0</span>
    <div style="margin-top:4px;">
        <div style="background:#333; border-radius:3px; height:6px; width:250px; display:inline-block; vertical-align:middle;">
            <div id="sim-progress" style="background:#43B047; height:100%; width:0%; border-radius:3px; transition:width 0.1s;"></div>
        </div>
    </div>
</div>
<div id="info-bar">Clic droit = orbiter | Molette = zoom</div>
<div id="surface-bar" style="position:fixed;bottom:35px;left:50%;transform:translateX(-50%);background:rgba(10,10,30,0.85);border:1px solid #43B047;border-radius:8px;padding:4px 14px;font-family:monospace;font-size:11px;color:#fff;z-index:5;display:flex;gap:15px;align-items:center;">
    <span id="surf-murs" style="color:#aaa;">Murs: 0</span>
    <span id="surf-sol" style="font-weight:bold;color:#43B047;cursor:pointer;border-bottom:1px dashed #43B047;" title="Cliquez pour le detail par piece">Sol: 0.00 m²</span>
    <span id="surf-mur-m2" style="color:#5bb8f0;">Murs: 0.00 m²</span>
    <span id="surf-lineaire" style="color:#aaa;">0.00 ml</span>
    <span id="surf-briques" style="color:#D2691E;">0 briques</span>
</div>

<!-- Popup detail surface par piece -->
<div id="surface-detail-popup" style="display:none;position:fixed;bottom:60px;left:50%;transform:translateX(-50%);background:rgba(10,10,30,0.95);border:2px solid #43B047;border-radius:10px;padding:14px;font-family:monospace;font-size:11px;color:#fff;z-index:15;min-width:300px;max-width:450px;max-height:50vh;overflow-y:auto;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <span style="font-size:13px;font-weight:bold;color:#43B047;">Surface des pieces (au sol)</span>
        <button id="surface-detail-close" style="background:#e94560;color:#fff;border:none;border-radius:4px;padding:2px 8px;cursor:pointer;font-family:monospace;font-size:10px;">X</button>
    </div>
    <div id="surface-detail-content"></div>
</div>
<input type="file" id="file-input" accept=".json" style="display:none">
