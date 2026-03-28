# ELEEC APP — Planificateur d'Installation Électrique

Application web pour concevoir visuellement l'installation électrique d'un logement (maison ou appartement), de la création du plan jusqu'au rapport final.

---

## Fonctionnalités

### 1. Assistant étape par étape
| Étape | Description |
|-------|-------------|
| **1. Nom** | Nommer le projet |
| **2. Type** | Maison ou appartement |
| **3. Config** | Nombre d'étages (maison) ou de pièces (appart), nommage des étages |
| **4. Plan** | Éditeur visuel des pièces, murs, portes, fenêtres et équipements |
| **5. Appareils** | Catalogue d'appareils électriques par pièce |
| **6. Rapport** | Synthèse complète avec arborescence et tableaux |

### 2. Éditeur de plan (style Sims)

**Pièces** — Cliquer-glisser sur la grille pour dessiner des rectangles :
- Salon, Chambre, Cuisine, Salle de bain, WC, Couloir, Cave, Garage, Bureau
- Chaque type a sa couleur
- Gomme pour effacer

**Murs, Portes & Fenêtres** — Placement manuel sur les lignes de la grille :
- **3 modes de mur** :
  - ╋ **Mur Auto** (gris) — s'adapte automatiquement H ou V selon le bord le plus proche
  - ━ **Mur H** (bleu) — uniquement les lignes horizontales
  - ┃ **Mur V** (rouge) — uniquement les lignes verticales
- Sélectionner **Porte** ou **Fenêtre** pour ces éléments
- Choisir l'**orientation** (Portes/Fenêtres) : ━ Horizontal, ┃ Vertical, ╲ Diagonal
- Les lignes correspondantes apparaissent sur la grille
- **Clic** = poser, **clic maintenu + glisser** = poser en continu
- Survol = preview avant placement (blanc pour mur, orange pour porte, bleu pour fenêtre)
- Les pièces n'ont **pas de murs par défaut** — liberté totale de placement
- Les murs/portes/fenêtres d'autres orientations restent visibles en grisé

**5 types de fenêtres** :
| Type | 2D | 3D |
|------|-----|-----|
| **▫ Simple** | Trait bleu plein | Allège haute, petite vitre |
| **▫▫ Double** | Double trait bleu | Vitre large + traverse centrale |
| **▭ Baie vitrée** | Bande dégradée bleue épaisse | Quasi pleine hauteur, vitre géante |
| **◇ Velux** | Trait bleu pointillé | Petite vitre + croisillon |
| **◯ Œil-de-bœuf** | Pastille ronde bleue | Sphère de verre + anneau cadre |

**Équipements** — Clic sur une cellule occupée pour placer :
- 🔌 Prise simple
- 🔌🔌 Double prise
- 🔘 Interrupteur

### 3. Trois modes de vue

| Vue | Description |
|-----|-------------|
| **2D (plan)** | Grille éditable, un étage à la fois, onglets par étage |
| **Coupe** | Tous les étages empilés verticalement (lecture seule) |
| **3D** | Vue Three.js interactive — rotation souris, zoom molette |

### 4. Vue 3D

- **Navigation** : clic gauche = tourner, molette = zoom
- **Sélecteur d'étage** (panneau gauche) : "Tous" ou un seul étage visible
- **Mode dessin 3D** : dessiner pièces, murs, portes, fenêtres et équipements directement dans la scène 3D
- **Barre d'outils en bas** de la vue 3D (ne gêne pas la scène)
- **Murs** : 3 modes (Auto / H / V) avec couleurs distinctes
- **Fenêtres** : bouton unique qui déploie les 5 sous-types au clic
- **Rendu réaliste** :
  - Pièces = sols colorés
  - Murs = blocs gris avec ombres
  - Portes = montants bois brun + linteau
  - Fenêtres = allège + vitre transparente bleutée + cadres (varie selon le type)
  - Murs diagonaux = blocs pivotés à 45°
  - Prises = plaques murales crème avec trous ronds (style prise française)
  - Interrupteurs = plaques avec bouton bascule en relief
  - Labels d'étage flottants

### 5. Catalogue d'appareils (étape 5)

| Appareil | Puissance |
|----------|-----------|
| Prise murale | — |
| Plafonnier | 60W |
| Lampe | 40W |
| Radiateur | 1 500W |
| Chauffe-eau | 2 000W |
| Four | 2 500W |
| Plaque cuisson | 3 000W |
| Réfrigérateur | 150W |
| Lave-linge | 2 200W |
| Lave-vaisselle | 1 800W |
| Sèche-linge | 2 500W |
| TV | 100W |
| Ordinateur | 300W |
| VMC | 30W |
| Chaudière | 200W |
| Climatisation | 2 000W |
| Volet roulant | 200W |

### 6. Rapport final (étape 6)

- **Résumé** : type, étages, pièces, appareils, puissance totale (kW), ampérage estimé (A)
- **Arborescence** : vue en arbre du projet (étages → pièces → appareils)
- **Tableau détaillé** : surface, nombre d'appareils et puissance par pièce et par étage
- **Export** : impression via `window.print()`

---

## Structure des fichiers

```
ELEEC_APP/
├── index.php           ← Page principale (wizard 6 étapes)
├── README.md           ← Ce fichier
├── css/
│   └── style.css       ← Styles (thème sombre, grille, palettes, 3D overlay)
├── js/
│   ├── app.js          ← Logique wizard, navigation, appareils, rapport
│   ├── grid.js         ← Grille 2D, pièces, murs, portes, fenêtres, équipements, vue coupe
│   └── view3d.js       ← Vue 3D Three.js, rendu, dessin 3D, sélection d'étage
└── test/
    ├── index.html      ← Page de tests (navigateur, via iframe)
    ├── test.js          ← Tests auto-exécutables (console navigateur)
    ├── test-data.json   ← Données de test (projet maison 3 étages)
    └── run-tests.js     ← Tests Node.js (44 assertions, DOM mocké)
```

---

## Stack technique

- **PHP 8** — page unique (pas de framework), cache-buster `?v=<?= time() ?>`
- **HTML / CSS / JS vanilla** — aucune dépendance côté serveur
- **Three.js r128** (CDN) — rendu 3D + OrbitControls
- **Données en mémoire** (JS) — pas de base de données, tout est côté client

---

## Données internes (JS)

```
projet.nom          → string
projet.type         → 'maison' | 'appartement'
projet.etages[]     → [{nom, numero}]
projet.appareils{}  → { roomId: [{nom, watts, icone}] }

Grid.floors{}       → { floorIndex: { roomKey: {type, cells[]} } }
Grid.walls{}        → { floorIndex: { "h_r_c": true } }
Grid.doors{}        → { floorIndex: { "h_r_c": true } }
Grid.windows{}      → { floorIndex: { "h_r_c": "simple"|"double"|"baie"|"velux"|"oeil" } }
Grid.equips{}       → { floorIndex: { "r_c": [{type, icon}] } }
Grid.wallOrient     → 'auto' | 'h' | 'v' | 'd'
Grid.windowType     → 'simple' | 'double' | 'baie' | 'velux' | 'oeil'
```

### Convention des bords (murs/portes/fenêtres)

```
h_R_C   →  bord horizontal en haut de la ligne R, colonne C
v_R_C   →  bord vertical à gauche de la colonne C, ligne R
d1_R_C  →  diagonale \ (top-left → bottom-right) de la cellule R,C
d2_R_C  →  diagonale / (top-right → bottom-left) de la cellule R,C
```

---

## Tests

### Tests Node.js (sans navigateur)
```bash
node test/run-tests.js
```
45 assertions couvrant : wallOrient, data model, isAdjacentTo, selectEquip (wall-h/wall-v/door/window/erase/prise), edge overlay (H/V/D), onEdgeConfirm (mur/porte/fenêtre/gomme), equips.

### Tests navigateur
Ouvrir `http://localhost/ELEEC_APP/test/` — les tests se lancent automatiquement dans un iframe et affichent les résultats.

---

## Utilisation

1. Ouvrir `http://localhost/ELEEC_APP/`
2. Suivre les 6 étapes du wizard
3. À l'étape 4 :
   - Dessiner les pièces (clic-glisser)
   - Sélectionner **Mur Auto**, **Mur H**, **Mur V**, **Porte** ou **Fenêtre** dans la palette Structure
   - Pour les portes/fenêtres, choisir l'orientation (Horizontal / Vertical / Diagonal)
   - Pour les fenêtres, choisir le type (Simple / Double / Baie / Velux / Œil-de-bœuf)
   - Cliquer ou glisser sur les lignes de la grille pour poser
   - Placer prises et interrupteurs (outils Équipements → clic dans les pièces)
   - Basculer en vue 3D pour visualiser
4. À l'étape 5 : ajouter les appareils électriques par pièce
5. Générer le rapport final

---

## Inspiré de

Le fichier `ELEEC/README.md` — compte rendu d'une installation électrique domestique (tableau, circuits, scénarios de coupure).

Cette application permet de **concevoir** une telle installation visuellement avant de la documenter.
