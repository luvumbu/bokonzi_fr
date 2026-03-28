# ELEEC APP V2 — Documentation

## Architecture

```
ELEEC_APP_V2/
├── index.php                  ← Page principale (editeur)
├── css/style.css              ← Styles
├── js/
│   ├── app.js                 ← Initialisation (SceneManager)
│   ├── scene/
│   │   ├── SceneManager.js    ← Scene 3D (camera, sol, grille, lumiere)
│   │   ├── Sun.js             ← Soleil (lumiere + sphere visuelle)
│   │   ├── Axes.js            ← Axes X Y Z colores
│   │   └── Brouillard.js      ← Effet brouillard
│   ├── engine/
│   │   └── Brique.js          ← Moteur briques (trous, formes, multicolore)
│   └── ui/
│       ├── Editeur.js         ← Gestion des elements (ajout, suppression, trous, reconstruction)
│       └── menu-editeur.js    ← Logique UI (modes, ghost, clics, toolbar)
├── ui/
│   └── menu-editeur.php       ← HTML/CSS de la toolbar et popups
├── constructions/             ← Fichiers JSON de constructions
├── test/exemples/             ← 26 exemples independants
└── docs/                      ← Documentation
```

---

## Interface de l'editeur

### Controles camera

| Action | Controle |
|---|---|
| Orbiter (tourner) | Clic droit + glisser |
| Zoom | Molette |

Le clic gauche est reserve aux outils (placement, trou, suppression).

### Toolbar

La barre d'outils en haut a gauche contient :

| Bouton | Description |
|---|---|
| **Mur** (briques) | Ouvre la grille de directions pour placer un mur |
| **Aimant** | Active/desactive l'alignement automatique sur le dernier mur pose |
| **Trou** (porte/fenetre) | Mode pour percer des trous dans les murs existants |
| **Supprimer** (X rouge) | Mode pour supprimer un mur existant |
| **Exporter** (fleche bas bleue) | Telecharge la scene en fichier JSON |
| **Importer** (fleche haut verte) | Charge un fichier JSON |

---

## Mode Placement (Mur)

### Grille de directions

Cliquer sur le bouton Mur ouvre une grille 3x3 :

```
  ◇135  |  ↑270  |  ◇45
  ←180  |  □ 0   |  → 0
  ◇225  |  ↓ 90  |  ◇315
```

- **Croix (haut/bas/gauche/droite)** : murs droits (1 seul mur)
- **Centre** : carre droit (4 murs fermes, angle 0)
- **4 coins** : carres diagonaux (angle de depart 45, 135, 225, 315)

### Popup de parametres

Apres avoir choisi une direction :

| Champ | Description | Defaut |
|---|---|---|
| Type | Mur droit / Carre | selon le bouton |
| Distance | Longueur du mur (m) | 5 |
| Hauteur | Hauteur du mur (m) | 2.50 |
| Cotes | 2 (L), 3 (U), 4 (carre) | 4 |
| Grille | Pas de la grille d'accroche (m) | 0.50 |
| Briques | Couleur + opacite (%) | #8B4513, 100% |
| Joints | Couleur + opacite (%) | #CCCCCC, 100% |
| Bicolore | 2e couleur alternee | desactive |

### Opacite

- 100% = opaque (normal)
- 50% = semi-transparent (on voit a travers)
- 0% = totalement transparent

### Bicolore

Active la checkbox "Bicolore" pour alterner 2 couleurs de briques. Le systeme cree 2 murs superposes avec `setIgnorer(2,1)` et `setIgnorer(2,2)`.

### Placement

1. Deplacer la souris : le ghost (preview transparente) suit le curseur
2. Clic gauche : pose le mur a cet endroit
3. Continuer a poser d'autres murs
4. Echap : quitter le mode

**Chevauchement** : poser un mur par-dessus un existant supprime automatiquement l'ancien.

**Aimant** : si actif, le mur s'accroche a la position du dernier mur pose (seuil 0.8m).

---

## Mode Trou (Porte / Fenetre)

Percer des trous dans les murs existants en cliquant directement dessus.

### Utilisation

1. Cliquer sur le bouton **Trou** dans la toolbar
2. Le popup trou apparait avec les parametres
3. Choisir un preset (Porte / Fenetre) ou configurer manuellement
4. Survoler un mur : il se surligne en orange + ghost rouge du trou
5. Clic gauche sur le mur : le trou est perce, le mur est reconstruit
6. Continuer a percer d'autres trous
7. Echap : quitter le mode

### Presets

| Preset | Largeur | Hauteur | Position Y |
|---|---|---|---|
| Porte | 0.90m | 2.10m | 0 (sol) |
| Fenetre | 1.20m | 1.20m | 0.90m |

### Parametres du trou

| Champ | Description |
|---|---|
| Largeur | Largeur du trou (m) |
| Hauteur | Hauteur du trou (m) |
| Position Y | Distance depuis le sol (m) |
| Alignement | Position du clic, Centre, Debut, Fin du mur |
| Decalage | Ajustement apres alignement (m) |

Pour les carres, le systeme detecte automatiquement sur quel cote (mur 0-3) le clic est fait.

---

## Mode Suppression

1. Cliquer sur le bouton **Supprimer** (X rouge)
2. Survoler un mur : il se surligne en rouge
3. Clic gauche : le mur est supprime
4. Echap : quitter le mode

---

## Export / Import JSON

### Exporter

Clic sur le bouton Exporter : telecharge `construction.json` contenant tous les murs avec leurs parametres.

### Importer

Clic sur le bouton Importer : ouvre un selecteur de fichier `.json`. Le fichier est charge et tous les murs sont reconstruits (la scene existante est videe).

### Format JSON

```json
{
    "nom": "Construction",
    "murs": [
        {
            "couleur": "#8B4513",
            "opacite": 1,
            "jointCouleur": "#CCCCCC",
            "jointOpacite": 1,
            "distance": 5,
            "hauteur": 2.50,
            "angle": 0,
            "x": 0, "y": 0, "z": 0,
            "trous": [
                {
                    "largeur": 0.90, "hauteur": 2.10,
                    "y": 0, "mur": 0,
                    "alignement": "center", "decalage": 0
                }
            ],
            "bicolore": {
                "couleur2": "#CC6633",
                "opacite2": 1
            }
        },
        {
            "couleur": "#8B4513",
            "distance": 5, "hauteur": 2.50,
            "nbCotes": 4, "angleDepart": 45,
            "x": 10, "y": 0, "z": 0
        }
    ]
}
```

### Champs JSON

| Champ | Type | Description |
|---|---|---|
| couleur | string | Couleur hex des briques |
| opacite | number | 0 a 1 (1 = opaque) |
| jointCouleur | string/null | Couleur hex du joint |
| jointOpacite | number | 0 a 1 |
| x, y, z | number | Position du mur |
| distance | number | Longueur du mur (m) |
| hauteur | number | Hauteur du mur (m) |
| angle | number | Angle pour mur droit (degres) |
| nbCotes | number | 1-4 pour construireForme |
| angleDepart | number | Angle de depart pour carre |
| trous | array | Liste de trous |
| bicolore | object | { couleur2, opacite2 } |
| dimensions | array | [l, h, e] personnalises |
| joint | number | Taille du joint (m) |
| vertical | boolean | Briques debout |
| ignorer | array | [tousLes, garder] pour motif |
| priorite | number | Priorite d'affichage |

---

## Classes internes

### Editeur (js/ui/Editeur.js)

Gere la liste des elements (murs) dans la scene.

| Methode | Description |
|---|---|
| `ajouterMur(params)` | Ajoute un mur (supprime les chevauchements d'abord) |
| `ajouterTrouElement(id, trou)` | Ajoute un trou a un mur existant et le reconstruit |
| `supprimer(id)` | Supprime un element |
| `viderTout()` | Supprime tous les elements |
| `exporterJSON(nom)` | Exporte en JSON |
| `importerJSON(jsonString)` | Importe depuis JSON |
| `trouverPositionSurMur(element, x, z)` | Trouve le mur index + position locale |
| `compterBriques()` | Compte total des briques |

**Bicolore** : quand `params.bicolore` est defini, l'editeur cree 2 objets Brique superposes avec `setIgnorer` et `setPriorite`, regroupes dans un `THREE.Group`.

**Chevauchement** : avant d'ajouter un mur, l'editeur verifie si des murs existants occupent le meme espace (segments paralleles, proches, qui se chevauchent) et les supprime.

### Brique (js/engine/Brique.js)

Moteur de construction de briques. Voir `docs/doc-brique.md` pour la reference complete.

Changements recents :
- `setCouleur(couleur, opacite)` : accepte un parametre opacite (0-1). Utilise `MeshBasicMaterial` quand < 1 pour un rendu transparent correct.
- `setCouleurJoint(couleur, opacite)` : idem pour les joints.
- `renderOrder = 1` sur les meshes transparents.

### SceneManager (js/scene/SceneManager.js)

- OrbitControls configure avec clic droit = orbiter, molette = zoom, clic gauche = libre
- Voir section SceneManager plus bas pour les methodes publiques

---

## SceneManager — Methodes publiques

```js
var sceneManager = new SceneManager(container);
```

| Methode | Description |
|---|---|
| `setCouleurCiel(couleur)` | Couleur unie du ciel |
| `setCielDegrade(haut, bas)` | Degrade du ciel |
| `setCouleurSol(couleur)` | Couleur du sol |
| `setAmbiante(intensite)` | Lumiere ambiante (0 a 2) |
| `setSoleil(intensite)` | Lumiere soleil (0 a 2) |
| `setPositionSoleil(x, y, z)` | Position du soleil |
| `setCamera(x, y, z)` | Position camera |
| `setCible(x, y, z)` | Point que la camera regarde |
| `setGrille(visible)` | Montrer/cacher la grille |
| `setPlateau(casesX, casesZ, tailleCasse)` | Taille du sol rectangulaire |

---

## Exemples disponibles

Tous dans `test/exemples/`, accessibles via :
`http://localhost/ELEEC_APP_V2/test/exemples/exNN-nom.php`

| # | Fichier | Description |
|---|---|---|
| 01 | ex01-mur-simple | Un seul mur droit |
| 02 | ex02-mur-angle | Mur tourne a 45 |
| 03 | ex03-carre | Carre 4 murs |
| 04 | ex04-forme-n-cotes | 1, 2 et 3 cotes |
| 05 | ex05-carre-tourne | Carre tourne a 45 |
| 06 | ex06-porte-centree | Mur avec porte centree |
| 07 | ex07-fenetre | Mur avec fenetre centree |
| 08 | ex08-porte-fenetre | Porte + fenetre |
| 09 | ex09-porte-2-fenetres | Porte + 2 fenetres |
| 10 | ex10-carre-trous-multi | Carre avec trous sur 3 murs |
| 11 | ex11-couleur | Couleurs personnalisees |
| 12 | ex12-vertical | Briques debout |
| 13 | ex13-dimensions | Dimensions personnalisees |
| 14 | ex14-motif | Motif une brique sur deux |
| 15 | ex15-murs-colles | Deux murs colles (getPositions) |
| 16 | ex16-mur-dessus | Mur au-dessus d'un autre |
| 17 | ex17-mur-derriere | Mur derriere un autre |
| 18 | ex18-sans-joint | Sans joint |
| 19 | ex19-deux-murs-decales | 2 couleurs |
| 20 | ex20-tricolore | 3 couleurs |
| 21 | ex21-quadricolore | 4 couleurs |
| 22 | ex22-cinq-couleurs | 5 couleurs |
| 23 | ex23-six-couleurs | 6 couleurs (Mario) |
| 24 | ex24-six-couleurs-carre | 6 couleurs carre |
| 25 | ex25-six-couleurs-carre-angle | 6 couleurs carre tourne |
| 26 | ex26-ajouter-detruire | Import JSON |

Ces exemples utilisent directement la classe `Brique` sans l'editeur (API bas niveau). L'editeur (`index.php`) utilise ces memes methodes via la classe `Editeur`.
