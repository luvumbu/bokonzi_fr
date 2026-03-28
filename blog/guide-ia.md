# Guide IA — Generation de batiments en briques pour ELEEC APP V2

---

## Resume rapide

ELEEC APP V2 est un simulateur 3D dans le navigateur qui construit des batiments
uniquement avec des briques. Il n'y a pas d'autres materiaux : pas de bois, pas de
verre, pas de metal. Tout ce que tu vois (murs, tours, creneaux, colonnes, pignons)
est fait de briques rectangulaires empilees les unes sur les autres.

Tu generes un fichier JSON. Ce JSON decrit une liste de murs. Chaque mur est un
ensemble de briques posees automatiquement par le moteur. Tu donnes la position,
la longueur, la hauteur, la couleur et les trous (portes, fenetres). Le moteur
calcule combien de briques il faut et les pose en quinconce.

Le fichier JSON est charge par la fonction `Brique.importer()` qui lit chaque
element du tableau `murs` et construit les briques dans la scene 3D.

---

## Glossaire

| Terme | Definition |
|---|---|
| **brique** | Un bloc rectangulaire de 22cm x 6.5cm x 11cm. L'unite de base de tout le systeme. |
| **joint** | L'espace de 1cm entre chaque brique (mortier). |
| **mur** | Un ensemble de briques empilees. Defini par une position, une longueur et une hauteur. |
| **distance** | La longueur d'un mur en metres (axe horizontal). |
| **hauteur** | La hauteur d'un mur en metres (axe vertical). |
| **angle** | La direction dans laquelle un mur est construit (en degres). |
| **trou** | Une zone vide dans un mur (porte ou fenetre). Les briques ne sont pas posees dans cette zone. |
| **alignement** | La methode pour positionner un trou : 'start', 'center', 'end'. |
| **decalage** | Un deplacement en metres apres l'alignement. Positif = droite, negatif = gauche. |
| **murIndex / mur** | Le numero du cote dans une forme carree (0=facade, 1=droite, 2=arriere, 3=gauche). |
| **nbCotes** | Le nombre de cotes d'une forme fermee (1 a 4). 4 = carre ferme. |
| **ignorer** | Un motif qui saute certaines briques pour creer des effets bicolores. |
| **priorite** | Quand deux murs sont au meme endroit, le chiffre le plus haut s'affiche devant. |
| **pignon** | La partie triangulaire (en escalier de briques) au-dessus d'un mur, qui represente la forme du toit. |
| **creneaux** | Un mur court au sommet d'une muraille avec des ouvertures regulieres. |

---

## Systeme de coordonnees

```
        z+ (profondeur / arriere)
        ↑
        │
        └──────→ x+ (largeur / droite)

y+ = hauteur (vers le haut)
```

- Le sol est le plan horizontal (x, z) a y = 0
- Unite : metres (1.00 = 1 metre)
- Un batiment a (0, 0, 0) a son coin avant-gauche a l'origine

---

## Comment une brique devient un mur

Une seule brique mesure :

```
    ┌──────────────────────┐
    │      22cm (longueur) │  ← 6.5cm de haut
    └──────────────────────┘
         11cm de profondeur (epaisseur)
```

Le moteur pose les briques de gauche a droite, rang par rang, du haut vers le bas.
Chaque rang est decale d'un demi-brique par rapport au precedent (appareil en quinconce).
Un joint de 1cm separe chaque brique.

```
    |████|████|████|████|████|    ← rang pair
      |████|████|████|████|      ← rang impair (decale)
    |████|████|████|████|████|    ← rang pair
      |████|████|████|████|      ← rang impair
```

**Module L** = 0.23m (brique 0.22 + joint 0.01) → espacement horizontal
**Module H** = 0.075m (brique 0.065 + joint 0.01) → espacement vertical

Un mur de 5m de long contient environ 5 / 0.23 = 22 briques par rang.
Un mur de 2.50m de haut contient environ 2.50 / 0.075 = 33 rangs.
Total : 22 x 33 = ~726 briques pour un seul mur.

---

## Les 2 methodes de construction

### construire — un seul mur droit

Cree un mur droit dans une direction donnee par un angle.

| Parametre | Type | Description |
|---|---|---|
| x, y, z | number | Position du coin de depart |
| distance | number | Longueur du mur en metres |
| hauteur | number | Hauteur du mur en metres |
| angle | number | Direction du mur en degres |

### Angles et directions

```
                z+
                ↑
                │  angle 90
                │  (vers z+)
                │
  angle 180 ←───┼───→ angle 0
  (vers x-)     │     (vers x+)
                │
                │  angle 270
                ↓  (vers z-)
```

| Angle | Direction | Utilisation typique |
|---|---|---|
| 0 | Vers x+ (droite) | Facade, mur arriere |
| 90 | Vers z+ (profondeur) | Mur droit, mur interieur vertical |
| 180 | Vers x- (gauche) | Mur arriere (sens retour) |
| 270 | Vers z- (devant) | Mur gauche (sens retour) |

### construireForme — forme fermee CARREE uniquement

Cree une forme fermee ou TOUS les cotes ont la MEME longueur.

| Parametre | Type | Description |
|---|---|---|
| x, y, z | number | Point de depart |
| distance | number | Longueur de CHAQUE cote (identique) |
| hauteur | number | Hauteur des murs |
| nbCotes | number | 1, 2, 3 ou 4 |
| angleDepart | number | Angle du premier mur |

```
nbCotes = 4 → carre ferme (tous cotes = distance)
nbCotes = 3 → trois murs en U
nbCotes = 2 → deux murs en L
nbCotes = 1 → un seul mur
```

**Index des murs dans un carre (nbCotes=4) :**

```
         mur 0 (facade, vers x+)
     ┌───────────────────────┐
     │                       │
mur 3│      (interieur)      │ mur 1
(z-) │                       │ (vers z+)
     │                       │
     └───────────────────────┘
         mur 2 (arriere, vers x-)
```

### REGLE IMPORTANTE : angle OU nbCotes, jamais les deux

- Si le batiment est **carre** (tous cotes egaux) → utiliser `nbCotes`
- Si le batiment est **rectangulaire** (cotes differents) → utiliser 4 murs avec `angle`
- Ne JAMAIS mettre `angle` ET `nbCotes` dans le meme element JSON

---

## Format JSON

### Structure globale

```json
{
    "nom": "Nom du batiment",
    "murs": [
        { ... element 1 ... },
        { ... element 2 ... },
        { ... element 3 ... }
    ]
}
```

Chaque element du tableau `murs` = une instance de Brique = un mur ou un groupe de murs.

### Champs d'un element mur

| Champ | Type | Requis | Description |
|---|---|---|---|
| commentaire | string | NON | Texte libre pour documenter |
| couleur | string | NON | Couleur hex des briques (defaut '#8B4513') |
| jointCouleur | string/null | NON | Couleur hex du joint (null = pas de joint) |
| x, y, z | number | OUI | Position du mur |
| distance | number | OUI | Longueur du mur (m) |
| hauteur | number | OUI | Hauteur du mur (m) |
| angle | number | NON | Direction pour un mur droit (defaut 0) |
| nbCotes | number | NON | Nombre de cotes pour forme carree (1-4) |
| angleDepart | number | NON | Angle du premier mur dans une forme |
| dimensions | array | NON | [longueur, hauteur, epaisseur] de la brique |
| joint | number | NON | Taille du joint (defaut 0.01) |
| vertical | boolean | NON | true = briques debout |
| ignorer | array | NON | [tousLes, garder] pour motif bicolore |
| priorite | number | NON | Affichage quand plusieurs couches superposees |
| trous | array | NON | Liste de trous (portes, fenetres) |

### Champs d'un trou

| Champ | Type | Requis | Description |
|---|---|---|---|
| x | number | NON | Position depuis le debut du mur (defaut 0) |
| y | number | NON | Position verticale depuis le bas (defaut 0 = sol) |
| largeur | number | OUI | Largeur du trou (m) |
| hauteur | number | OUI | Hauteur du trou (m) |
| alignement | string | NON | 'start', 'center', 'end', 'between' |
| decalage | number | NON | Deplacement apres alignement (m) |
| mur | number | NON | Index du mur (0-3, defaut 0) |

### Positionnement des trous avec alignement

```
alignement 'start'         [TROU]_________________________   debut du mur
alignement 'center'        __________[TROU]_______________   milieu du mur
alignement 'end'           _________________________[TROU]   fin du mur

'center', decalage=+3      _____________[TROU]____________   milieu + 3m a droite
'center', decalage=-3      _____[TROU]____________________   milieu + 3m a gauche
```

---

## Exemple minimal complet

Le plus petit batiment possible : une piece carree de 4m x 4m avec une porte.

```json
{
    "nom": "Piece simple",
    "murs": [
        {
            "couleur": "#8B4513",
            "jointCouleur": "#CCCCCC",
            "x": 0, "y": 0, "z": 0,
            "distance": 4, "hauteur": 2.50,
            "nbCotes": 4,
            "trous": [
                { "largeur": 0.90, "hauteur": 2.15, "alignement": "center", "mur": 0 }
            ]
        }
    ]
}
```

Ce JSON cree 4 murs de 4m formant un carre, hauteur 2.50m, avec une porte
de 0.90m x 2.15m centree sur la facade (mur 0). Environ 2900 briques au total.

---

## Tailles standards des ouvertures

### Portes

| Usage | largeur | hauteur | y |
|---|---|---|---|
| Porte interieure | 0.83 | 2.04 | 0 |
| Porte standard (entree) | 0.90 | 2.15 | 0 |
| Petite porte (WC) | 0.63 | 2.04 | 0 |
| Porte double | 1.46 | 2.04 | 0 |
| Grande baie / arche | 2.40 | 2.15 | 0 |

### Fenetres

| Usage | largeur | hauteur | y |
|---|---|---|---|
| Petite (WC) | 0.60 | 0.60 | 1.60 |
| Moyenne (SdB) | 0.80 | 0.80 | 1.20 |
| Standard | 1.00 a 1.20 | 1.00 | 0.90 |
| Grande | 1.80 | 1.20 | 0.90 |
| Baie vitree | 2.40 | 2.15 | 0.10 |
| Meurtriere (chateau) | 0.40 | 1.00 | variable |

---

## Ordre de construction d'un batiment

Suivre cet ordre pour organiser les elements dans le JSON :

### Etape 1 — Murs exterieurs

Construire l'enveloppe du batiment.

**Si carre :** un seul element avec `nbCotes: 4`
**Si rectangle :** 4 elements avec angles 0, 90, 180, 270

### Etape 2 — Ouvertures (trous)

Ajouter les portes et fenetres dans les murs exterieurs via le champ `trous`.

### Etape 3 — Couches decoratives (bicolore)

Dupliquer les murs exterieurs avec une couleur differente, `ignorer`, `priorite`,
`jointCouleur: null`, et les MEMES trous.

### Etape 4 — Murs interieurs

Ajouter les cloisons qui divisent l'interieur en pieces.
Couleur plus claire, portes interieures pour circuler.

### Etape 5 — Elements de toiture (pignons)

Ajouter les murs en escalier au-dessus des murs pour former la silhouette du toit.

### Etape 6 — Elements decoratifs

Creneaux, tours, piliers, bandes de briques verticales, etc.

---

## Techniques de construction

### Technique 1 — Batiment rectangulaire

`construireForme` cree des CARRES. Pour un RECTANGLE, utiliser 4 murs.

**Principe :** faire le tour du rectangle dans le sens horaire.

```
Point de depart de chaque mur :

     (0,0,0) ──── angle 0 ────→ (L,0,0)
        │                          │
   angle 270                   angle 90
        │                          │
     (0,0,P) ←── angle 180 ──── (L,0,P)

L = largeur, P = profondeur
```

**Exemple : rectangle 10m x 8m**

```json
[
    { "x": 0,  "y": 0, "z": 0, "distance": 10, "hauteur": 2.70, "angle": 0 },
    { "x": 10, "y": 0, "z": 0, "distance": 8,  "hauteur": 2.70, "angle": 90 },
    { "x": 10, "y": 0, "z": 8, "distance": 10, "hauteur": 2.70, "angle": 180 },
    { "x": 0,  "y": 0, "z": 8, "distance": 8,  "hauteur": 2.70, "angle": 270 }
]
```

### Technique 2 — Murs interieurs

Les murs interieurs sont des murs droits places entre les murs exterieurs.
Ils divisent l'espace en pieces.

**Mur horizontal (coupe avant/arriere) :** angle = 0, va vers x+
**Mur vertical (coupe gauche/droite) :** angle = 90, va vers z+

```json
{
    "commentaire": "Cloison a z=4.5, toute la largeur",
    "couleur": "#C4A882",
    "jointCouleur": "#D4C5A9",
    "x": 0, "y": 0, "z": 4.5,
    "distance": 10, "hauteur": 2.70,
    "angle": 0,
    "trous": [
        { "largeur": 0.83, "hauteur": 2.04, "alignement": "center", "mur": 0 }
    ]
}
```

**Regles :**
- Couleur plus claire que les murs exterieurs
- Portes interieures de 0.83m x 2.04m
- La `distance` = la longueur de la zone couverte (pas tout le batiment si partiel)
- Un mur partiel commence a une coordonnee precise : ex. x=7 au lieu de x=0

### Technique 3 — Bicolore / multicolore

Superposer deux murs identiques au meme endroit avec des couleurs differentes
et des motifs complementaires.

**ATTENTION — REGLE CRITIQUE :**
Les deux couches DOIVENT avoir un champ `priorite`. Sans priorite, les briques
superposees clignotent (Z-fighting). La couche 1 a `"priorite": 1`, la couche 2
a `"priorite": 2`, etc. NE JAMAIS oublier `"priorite": 1` sur la couche de base.

**Couche 1 (base) — DOIT avoir priorite: 1 :**

```json
{
    "couleur": "#A0522D",
    "jointCouleur": "#D4C5A9",
    "x": 0, "y": 0, "z": 0,
    "distance": 10, "hauteur": 2.70,
    "angle": 0,
    "priorite": 1,
    "trous": [
        { "largeur": 0.90, "hauteur": 2.15, "alignement": "center", "mur": 0 }
    ]
}
```

**Couche 2 (accent) — meme position, memes trous, priorite: 2 :**

```json
{
    "couleur": "#CD853F",
    "jointCouleur": null,
    "x": 0, "y": 0, "z": 0,
    "distance": 10, "hauteur": 2.70,
    "angle": 0,
    "ignorer": [5, 2],
    "priorite": 2,
    "trous": [
        { "largeur": 0.90, "hauteur": 2.15, "alignement": "center", "mur": 0 }
    ]
}
```

**Regles obligatoires du bicolore :**
1. `"priorite": 1` sur la couche de base — OBLIGATOIRE sinon clignotement
2. `"priorite": 2` (ou plus) sur les couches suivantes
3. Meme x, y, z, distance, hauteur, angle sur toutes les couches
4. MEMES trous sur toutes les couches (copier-coller exact)
5. `"jointCouleur": null` sur couche 2+ (sinon double joint visible)
6. La couche de base garde ses joints normaux

**Motifs ignorer :**

| ignorer | Resultat |
|---|---|
| [2, 1] | 1 brique sur 2 (impaires) |
| [2, 2] | 1 brique sur 2 (paires) |
| [3, 1] | 1 brique sur 3 (position 1) |
| [3, 2] | 1 brique sur 3 (position 2) |
| [5, 2] | 1 brique sur 5 (subtil) |

### Technique 4 — Pignons (toit en escalier)

Pour representer un toit a deux pentes, empiler des murs de plus en plus courts
au-dessus des murs lateraux.

**Principe :** 5 etapes, chacune plus courte et centree.

```
          ___
         |   |        ← etape 5 (sommet)
        |_____|       ← etape 4
       |_______|      ← etape 3
      |_________|     ← etape 2
     |___________|    ← etape 1
    |_____________|   ← mur principal (dessous)
```

**Calcul pour un mur de L metres :**

| Etape | y | distance | position depart |
|---|---|---|---|
| 1 | hauteur_mur | L × 0.88 | debut + L × 0.06 |
| 2 | +0.50 | L × 0.69 | debut + L × 0.16 |
| 3 | +0.50 | L × 0.50 | debut + L × 0.25 |
| 4 | +0.50 | L × 0.31 | debut + L × 0.34 |
| 5 | +0.50 | L × 0.19 | debut + L × 0.41 |

**Orientation :**
- Toit le long de x (crete sur x) → pignons sur murs lateraux (angle 90)
- Toit le long de z (crete sur z) → pignons sur facade/arriere (angle 0)

**Toujours faire 2 pignons :** un de chaque cote du batiment.

### Technique 5 — Creneaux (chateaux)

Un mur tres court (0.60m) place au sommet d'un mur, avec des trous reguliers.

```
    |█|  |█|  |█|  |█|  |█|    ← creneaux (plein/vide/plein)
    |████████████████████████|   ← mur principal (dessous)
```

**Calcul :**
- Espacement = 1.50m (merlon 0.80m + ouverture 0.70m)
- Premier trou a x = 0.75m
- Trous suivants a x = 0.75 + N × 1.50
- Largeur de chaque trou = 0.70m
- Hauteur des trous = hauteur du mur de creneaux (0.60m)

```json
{
    "commentaire": "Creneaux sur mur de 15m",
    "x": 0, "y": 3, "z": 0,
    "distance": 15, "hauteur": 0.60,
    "nbCotes": 4,
    "trous": [
        { "x": 0.75, "largeur": 0.70, "hauteur": 0.60, "mur": 0 },
        { "x": 2.25, "largeur": 0.70, "hauteur": 0.60, "mur": 0 },
        { "x": 3.75, "largeur": 0.70, "hauteur": 0.60, "mur": 0 }
    ]
}
```

### Technique 6 — Niveaux empiles (pyramide a degres)

Empiler des formes carrees de plus en plus petites.

**Calcul :**
- Retrait par cote = (taille_N - taille_N+1) / 2
- x_N+1 = x_N + retrait
- z_N+1 = z_N + retrait
- y_N+1 = y_N + hauteur_N

```json
[
    { "x": 0, "y": 0,   "z": 0, "distance": 15, "hauteur": 3,   "nbCotes": 4 },
    { "x": 2, "y": 3,   "z": 2, "distance": 11, "hauteur": 2.5, "nbCotes": 4 },
    { "x": 4, "y": 5.5, "z": 4, "distance": 7,  "hauteur": 2,   "nbCotes": 4 }
]
```

### Technique 7 — Tours d'angle

Des carres plus hauts places aux coins du batiment, depassant legerement.

**Positions pour un batiment de D metres a (0,0,0) :**

| Tour | x | z |
|---|---|---|
| Avant-gauche | -debord | -debord |
| Avant-droite | D - taille + debord | -debord |
| Arriere-gauche | -debord | D - taille + debord |
| Arriere-droite | D - taille + debord | D - taille + debord |

(debord = 1m environ, taille = taille de la tour)

### Technique 8 — Briques verticales decoratives

Superposer un mur en briques verticales avec un motif clairseme.

```json
{
    "couleur": "#DEB887",
    "jointCouleur": null,
    "vertical": true,
    "ignorer": [4, 1],
    "priorite": 2
}
```

---

## Limitations du moteur

Le moteur ne peut construire QU'avec des briques rectangulaires.

| Possible | Impossible |
|---|---|
| Murs droits | Murs courbes / cylindriques |
| Carres et rectangles | Cercles, hexagones |
| Fenetres et portes rectangulaires | Arcs, voutes, formes arrondies |
| Pignons en escalier | Toits inclines lisses |
| Tours carrees | Tours rondes |
| Creneaux | Coupoles, domes |
| Briques horizontales et verticales | Briques en diagonale |
| Niveaux empiles (pyramide) | Porte-a-faux, balcons |

---

## Checklist finale de validation

Avant de livrer un JSON, verifier CHAQUE point :

### Structure JSON
- [ ] Le fichier a un champ `nom` (string)
- [ ] Le fichier a un champ `murs` (tableau)
- [ ] Pas de virgule apres le dernier element d'un tableau
- [ ] Guillemets doubles pour toutes les cles et valeurs string
- [ ] Le JSON est valide (pas d'erreur de syntaxe)

### Chaque mur
- [ ] A une position `x`, `y`, `z`
- [ ] A une `distance` (longueur) et une `hauteur`
- [ ] Utilise `angle` OU `nbCotes`, JAMAIS les deux
- [ ] Couleur en format hex (#RRGGBB)

### Batiment rectangulaire
- [ ] 4 murs individuels avec angles 0, 90, 180, 270
- [ ] Points de depart corrects (tour du rectangle dans le sens horaire)
- [ ] PAS de nbCotes (reserve aux carres)

### Trous (portes et fenetres)
- [ ] `largeur` et `hauteur` definis
- [ ] `y` >= 0
- [ ] `y + hauteur` <= hauteur du mur
- [ ] `largeur` < distance du mur
- [ ] Trous ne se chevauchent pas sur le meme mur
- [ ] `mur` correspond a un cote existant (0-3)

### Bicolore / multicolore (CRITIQUE — cause de clignotement si oublie)
- [ ] `"priorite": 1` sur la couche de base — NE JAMAIS OUBLIER
- [ ] `"priorite": 2` (ou plus) sur les couches accent
- [ ] Meme position, distance, hauteur, angle sur toutes les couches
- [ ] MEMES trous copiees exactement sur toutes les couches
- [ ] `"jointCouleur": null` sur les couches 2, 3, etc.

### Murs interieurs
- [ ] Position entre les murs exterieurs (pas en dehors)
- [ ] `distance` = longueur de la zone couverte
- [ ] Portes interieures (0.83m x 2.04m) pour circuler
- [ ] Couleur differente (plus claire) que les murs exterieurs

### Pignons
- [ ] 2 pignons symetriques (un de chaque cote)
- [ ] 5 etapes de plus en plus courtes et centrees
- [ ] Position y = sommet du mur principal
- [ ] Meme couleur que les murs exterieurs

---

## Erreurs frequentes

| Erreur | Consequence | Correction |
|---|---|---|
| nbCotes=4 pour un rectangle | Batiment carre | Utiliser 4 murs avec angle |
| angle ET nbCotes ensemble | Comportement imprevisible | Choisir l'un ou l'autre |
| Oublier trous sur couche bicolore | Briques dans les fenetres | Copier les memes trous |
| jointCouleur sur couche 2+ | Double joint visible | Mettre null sauf couche 1 |
| Pas de priorite sur couche de base | Clignotement (Z-fighting) | `"priorite": 1` sur couche 1, `"priorite": 2` sur couche 2 |
| priorite seulement sur couche 2 | Clignotement (Z-fighting) | Les DEUX couches doivent avoir priorite |
| Mauvais point de depart d'un mur | Mur decale | Verifier le sens du tour |
| Mur interieur trop long | Depasse du batiment | distance = zone couverte |
| Trou plus large que le mur | Rendu casse | largeur < distance |
| Pignon sur un seul cote | Toit asymetrique | Toujours 2 pignons |

---

## Exemples JavaScript — toutes les fonctions de la classe Brique

Ces exemples montrent comment utiliser chaque fonction en JavaScript.
Ils sont classes du plus simple au plus complexe.

### ex01 — Mur simple

```js
var mur = new Brique(sceneManager.scene);
mur.construire(0, 0, 0, 5, 2.50, 0);
```

### ex02 — Mur en diagonale (angle 45)

```js
var mur = new Brique(sceneManager.scene);
mur.construire(0, 0, 0, 5, 2.50, 45);
```

### ex03 — Carre ferme (4 cotes)

```js
var mur = new Brique(sceneManager.scene);
mur.construireForme(0, 0, 0, 5, 2.50, 4, 0);
```

### ex04 — Formes 1, 2, 3 cotes

```js
var mur1 = new Brique(sceneManager.scene);
mur1.construireForme(0, 0, 0, 3, 1.50, 1, 0);   // 1 mur

var mur2 = new Brique(sceneManager.scene);
mur2.construireForme(5, 0, 0, 3, 1.50, 2, 0);   // L (2 murs)

var mur3 = new Brique(sceneManager.scene);
mur3.construireForme(10, 0, 0, 3, 1.50, 3, 0);  // U (3 murs)
```

### ex05 — Carre tourne a 45 degres

```js
var mur = new Brique(sceneManager.scene);
mur.construireForme(0, 0, 0, 5, 2.50, 4, 45);
```

### ex06 — Porte centree

```js
var mur = new Brique(sceneManager.scene);
mur.ajouterTrou(0, 0, 0.90, 2.15, 'center', 0, 0);
mur.construire(0, 0, 0, 5, 2.50, 0);
```

### ex07 — Fenetre centree

```js
var mur = new Brique(sceneManager.scene);
mur.ajouterTrou(0, 0.90, 1.20, 1.20, 'center', 0, 0);
mur.construire(0, 0, 0, 5, 2.50, 0);
```

### ex08 — Porte + fenetre

```js
var mur = new Brique(sceneManager.scene);
mur.ajouterTrou(0, 0, 0.90, 2.15, 'center', 0, 0);
mur.ajouterTrou(0, 0.90, 1.20, 1.20, 'start', 0.3, 0);
mur.construire(0, 0, 0, 5, 2.50, 0);
```

### ex09 — Porte + 2 fenetres

```js
var mur = new Brique(sceneManager.scene);
mur.ajouterTrou(0, 0, 0.90, 2.15, 'center', 0, 0);
mur.ajouterTrou(0, 0.90, 1.00, 1.00, 'start', 0.3, 0);
mur.ajouterTrou(0, 0.90, 1.00, 1.00, 'end', -0.3, 0);
mur.construire(0, 0, 0, 5, 2.50, 0);
```

### ex10 — Carre avec trous sur plusieurs murs

```js
var mur = new Brique(sceneManager.scene);
mur.ajouterTrou(0, 0, 0.90, 2.15, 'center', 0, 0);        // porte facade
mur.ajouterTrou(0, 0.90, 1.00, 1.00, 'start', 0.3, 0);    // fenetre gauche facade
mur.ajouterTrou(0, 0.90, 1.00, 1.00, 'end', -0.3, 0);     // fenetre droite facade
mur.ajouterTrou(0, 0.90, 1.20, 1.20, 'center', 0, 1);     // fenetre mur droit
mur.ajouterTrou(0, 0.90, 1.20, 1.20, 'center', -1, 2);    // fenetre mur arriere gauche
mur.ajouterTrou(0, 0.90, 1.20, 1.20, 'center', 1, 2);     // fenetre mur arriere droite
mur.construireForme(0, 0, 0, 5, 2.50, 4, 0);
```

### ex11 — Couleur personnalisee

```js
var mur = new Brique(sceneManager.scene);
mur.setCouleur('#CC6633');
mur.setCouleurJoint('#000000');
mur.construire(0, 0, 0, 5, 2.50, 0);
```

### ex12 — Briques verticales

```js
var mur = new Brique(sceneManager.scene);
mur.setVertical(true);
mur.construire(0, 0, 0, 5, 2.50, 0);
```

### ex13 — Dimensions personnalisees

```js
var mur = new Brique(sceneManager.scene);
mur.setDimensions(0.30, 0.10, 0.15);  // brique plus grande
mur.setJoint(0.02);                    // joint plus large
mur.construire(0, 0, 0, 5, 2.50, 0);
```

### ex14 — Motif (ignorer 1 brique sur 2)

```js
var mur = new Brique(sceneManager.scene);
mur.setIgnorer(2, false);
mur.construire(0, 0, 0, 5, 2.50, 0);
```

### ex15 — Murs colles avec getPositions

```js
var mur1 = new Brique(sceneManager.scene);
mur1.setCouleur('#8B4513');
mur1.construire(0, 0, 0, 5, 2.50, 0);

var pos = mur1.getPositions(0, 0, 0, 5, 2.50);

var mur2 = new Brique(sceneManager.scene);
mur2.setCouleur('#CC6633');
mur2.construire(pos.droite, 0, 0, 3, 2.50, 0);  // colle a droite
```

### ex16 — Mur au-dessus (empile)

```js
var mur1 = new Brique(sceneManager.scene);
mur1.construire(0, 0, 0, 5, 1, 0);

var pos = mur1.getPositions(0, 0, 0, 5, 1);

var mur2 = new Brique(sceneManager.scene);
mur2.setVertical(true);
mur2.setCouleur('#CC6633');
mur2.construire(pos.gauche, pos.haut, pos.exterieur.z, pos.largeur, 0.5, 0);
```

### ex17 — Mur derriere

```js
var mur1 = new Brique(sceneManager.scene);
mur1.construire(0, 0, 0, 5, 2.50, 0);

var pos = mur1.getPositions(0, 0, 0, 5, 2.50);

var mur2 = new Brique(sceneManager.scene);
mur2.setCouleur('#CC6633');
mur2.construire(pos.derriere.x, pos.derriere.y, pos.derriere.z, 5, 2.50, 0);
```

### ex18 — Sans joint

```js
var mur = new Brique(sceneManager.scene);
mur.setCouleurJoint(null);
mur.construire(0, 0, 0, 5, 2.50, 0);
```

### ex19 — Bicolore (2 couches superposees)

```js
var mur_1 = new Brique(sceneManager.scene);
mur_1.setCouleur('#8b6132');
mur_1.setCouleurJoint('#000000');
mur_1.setIgnorer(2, false);
mur_1.setPriorite(1);               // OBLIGATOIRE sur couche 1
mur_1.construire(0, 0, 0, 5, 2.50, 0);

var mur_2 = new Brique(sceneManager.scene);
mur_2.setCouleur('#CC6633');
mur_2.setCouleurJoint('#000000');
mur_2.setIgnorer(2, true);
mur_2.setPriorite(2);               // couche 2 devant
mur_2.construire(0, 0, 0, 5, 2.50, 0);
```

### ex20 — Tricolore (3 couches)

```js
var mur_1 = new Brique(sceneManager.scene);
mur_1.setCouleur('#8b6132');
mur_1.setCouleurJoint('#000000');
mur_1.setIgnorer(3, 1);
mur_1.setPriorite(1);
mur_1.construire(0, 0, 0, 5, 2.50, 0);

var mur_2 = new Brique(sceneManager.scene);
mur_2.setCouleur('#CC6633');
mur_2.setCouleurJoint(null);         // PAS de joint sur couche 2+
mur_2.setIgnorer(3, 2);
mur_2.setPriorite(2);
mur_2.construire(0, 0, 0, 5, 2.50, 0);

var mur_3 = new Brique(sceneManager.scene);
mur_3.setCouleur('#F5DEB3');
mur_3.setCouleurJoint(null);
mur_3.setIgnorer(3, 3);
mur_3.setPriorite(3);
mur_3.construire(0, 0, 0, 5, 2.50, 0);
```

### ex21 — Quadricolore (4 couches)

```js
// Couche 1 — brun, avec joint
var mur_1 = new Brique(sceneManager.scene);
mur_1.setCouleur('#8b6132');
mur_1.setCouleurJoint('#000000');
mur_1.setIgnorer(4, 1);
mur_1.setPriorite(1);
mur_1.construire(0, 0, 0, 5, 2.50, 0);

// Couche 2 — orange, sans joint
var mur_2 = new Brique(sceneManager.scene);
mur_2.setCouleur('#CC6633');
mur_2.setCouleurJoint(null);
mur_2.setIgnorer(4, 2);
mur_2.setPriorite(2);
mur_2.construire(0, 0, 0, 5, 2.50, 0);

// Couche 3 — beige, sans joint
var mur_3 = new Brique(sceneManager.scene);
mur_3.setCouleur('#F5DEB3');
mur_3.setCouleurJoint(null);
mur_3.setIgnorer(4, 3);
mur_3.setPriorite(3);
mur_3.construire(0, 0, 0, 5, 2.50, 0);

// Couche 4 — gris, sans joint
var mur_4 = new Brique(sceneManager.scene);
mur_4.setCouleur('#555555');
mur_4.setCouleurJoint(null);
mur_4.setIgnorer(4, 4);
mur_4.setPriorite(4);
mur_4.construire(0, 0, 0, 5, 2.50, 0);
```

### ex22 — Cinq couleurs

Meme principe que ex21 mais avec `setIgnorer(5, N)` et 5 couches.

### ex23 — Six couleurs Mario (mur droit)

```js
// 6 couches, meme mur, couleurs Mario
// Couche 1 : rouge #E52521, joint #1A1A1A, ignorer(6,1), priorite 1
// Couche 2 : bleu #049CD8, joint null, ignorer(6,2), priorite 2
// Couche 3 : jaune #FBD000, joint null, ignorer(6,3), priorite 3
// Couche 4 : vert #43B047, joint null, ignorer(6,4), priorite 4
// Couche 5 : brun #A0522D, joint null, ignorer(6,5), priorite 5
// Couche 6 : orange #FABB5A, joint null, ignorer(6,6), priorite 6
// Toutes au meme endroit : construire(0, 0, 0, 5, 2.50, 0)
```

### ex24 — Six couleurs Mario (carre)

Meme chose que ex23 mais avec `construireForme(0, 0, 0, 5, 2.50, 4, 0)`.

### ex25 — Six couleurs Mario (carre tourne 45°)

Meme chose que ex24 mais avec `construireForme(0, 0, 0, 5, 2.50, 4, 45)`.

---

## Exemples complets de constructions

Tous les fichiers JSON sont dans le dossier `constructions/`.

### Exemple 1 — Mur simple avec porte (fichier: mur-simple.json)

Le plus simple possible : 1 seul mur, 1 porte.

```json
{
    "nom": "Mur simple avec porte",
    "murs": [
        {
            "couleur": "#8b6132",
            "jointCouleur": "#000000",
            "x": 0, "y": 0, "z": 0,
            "distance": 5, "hauteur": 2.50,
            "angle": 0,
            "trous": [
                { "largeur": 0.90, "hauteur": 2.15, "alignement": "center", "mur": 0 }
            ]
        }
    ]
}
```

### Exemple 2 — Palais Royal (fichier: palais.json)

Batiment carre 12m + 4 tours d'angle + ailes laterales + mur d'enceinte + piliers.
Techniques : `nbCotes: 4`, tours aux coins, murs individuels avec `angle`.

```json
{
    "nom": "Palais Royal",
    "murs": [
        {
            "commentaire": "Corps principal : carre 12m x 12m, hauteur 4m",
            "couleur": "#8B6132",
            "jointCouleur": "#2A2A2A",
            "x": 0, "y": 0, "z": 0,
            "distance": 12, "hauteur": 4,
            "nbCotes": 4, "angleDepart": 0,
            "trous": [
                { "largeur": 2.00, "hauteur": 3.20, "alignement": "center", "mur": 0 },
                { "y": 1.20, "largeur": 1.00, "hauteur": 1.20, "alignement": "center", "decalage": -3.5, "mur": 0 },
                { "y": 1.20, "largeur": 1.00, "hauteur": 1.20, "alignement": "center", "decalage": 3.5, "mur": 0 },
                { "y": 1.20, "largeur": 1.20, "hauteur": 1.20, "alignement": "center", "decalage": -2.5, "mur": 1 },
                { "y": 1.20, "largeur": 1.20, "hauteur": 1.20, "alignement": "center", "decalage": 2.5, "mur": 1 },
                { "y": 1.20, "largeur": 1.20, "hauteur": 1.20, "alignement": "center", "decalage": -3, "mur": 2 },
                { "y": 1.20, "largeur": 1.20, "hauteur": 1.20, "alignement": "center", "mur": 2 },
                { "y": 1.20, "largeur": 1.20, "hauteur": 1.20, "alignement": "center", "decalage": 3, "mur": 2 },
                { "y": 1.20, "largeur": 1.20, "hauteur": 1.20, "alignement": "center", "decalage": -2.5, "mur": 3 },
                { "y": 1.20, "largeur": 1.20, "hauteur": 1.20, "alignement": "center", "decalage": 2.5, "mur": 3 }
            ]
        },
        {
            "commentaire": "Tour avant-gauche : 3m x 3m, hauteur 6m",
            "couleur": "#6B4226",
            "jointCouleur": "#1A1A1A",
            "x": -3, "y": 0, "z": -3,
            "distance": 3, "hauteur": 6,
            "nbCotes": 4,
            "trous": [
                { "y": 1.50, "largeur": 0.60, "hauteur": 0.80, "alignement": "center", "mur": 0 },
                { "y": 3.50, "largeur": 0.60, "hauteur": 0.80, "alignement": "center", "mur": 0 },
                { "y": 1.50, "largeur": 0.60, "hauteur": 0.80, "alignement": "center", "mur": 1 },
                { "y": 3.50, "largeur": 0.60, "hauteur": 0.80, "alignement": "center", "mur": 1 },
                { "y": 3.50, "largeur": 0.60, "hauteur": 0.80, "alignement": "center", "mur": 3 }
            ]
        },
        {
            "commentaire": "Tour avant-droite",
            "couleur": "#6B4226",
            "jointCouleur": "#1A1A1A",
            "x": 12, "y": 0, "z": -3,
            "distance": 3, "hauteur": 6,
            "nbCotes": 4,
            "trous": [
                { "y": 1.50, "largeur": 0.60, "hauteur": 0.80, "alignement": "center", "mur": 0 },
                { "y": 3.50, "largeur": 0.60, "hauteur": 0.80, "alignement": "center", "mur": 0 },
                { "y": 1.50, "largeur": 0.60, "hauteur": 0.80, "alignement": "center", "mur": 1 },
                { "y": 3.50, "largeur": 0.60, "hauteur": 0.80, "alignement": "center", "mur": 3 },
                { "y": 3.50, "largeur": 0.60, "hauteur": 0.80, "alignement": "center", "mur": 1 }
            ]
        },
        {
            "commentaire": "Tour arriere-gauche",
            "couleur": "#6B4226",
            "jointCouleur": "#1A1A1A",
            "x": -3, "y": 0, "z": 12,
            "distance": 3, "hauteur": 6,
            "nbCotes": 4,
            "trous": [
                { "y": 3.50, "largeur": 0.60, "hauteur": 0.80, "alignement": "center", "mur": 2 },
                { "y": 3.50, "largeur": 0.60, "hauteur": 0.80, "alignement": "center", "mur": 3 }
            ]
        },
        {
            "commentaire": "Tour arriere-droite",
            "couleur": "#6B4226",
            "jointCouleur": "#1A1A1A",
            "x": 12, "y": 0, "z": 12,
            "distance": 3, "hauteur": 6,
            "nbCotes": 4,
            "trous": [
                { "y": 3.50, "largeur": 0.60, "hauteur": 0.80, "alignement": "center", "mur": 1 },
                { "y": 3.50, "largeur": 0.60, "hauteur": 0.80, "alignement": "center", "mur": 2 }
            ]
        },
        {
            "commentaire": "Aile gauche : mur avant",
            "couleur": "#A07850",
            "jointCouleur": "#2A2A2A",
            "x": -3, "y": 0, "z": 0,
            "distance": 3, "hauteur": 3,
            "angle": 0,
            "trous": [
                { "largeur": 0.90, "hauteur": 2.15, "alignement": "center", "mur": 0 }
            ]
        },
        {
            "commentaire": "Aile gauche : mur arriere",
            "couleur": "#A07850",
            "jointCouleur": "#2A2A2A",
            "x": 0, "y": 0, "z": 12,
            "distance": 3, "hauteur": 3,
            "angle": 180
        },
        {
            "commentaire": "Aile droite : mur avant",
            "couleur": "#A07850",
            "jointCouleur": "#2A2A2A",
            "x": 12, "y": 0, "z": 0,
            "distance": 3, "hauteur": 3,
            "angle": 0,
            "trous": [
                { "largeur": 0.90, "hauteur": 2.15, "alignement": "center", "mur": 0 }
            ]
        },
        {
            "commentaire": "Aile droite : mur arriere",
            "couleur": "#A07850",
            "jointCouleur": "#2A2A2A",
            "x": 15, "y": 0, "z": 12,
            "distance": 3, "hauteur": 3,
            "angle": 180
        },
        {
            "commentaire": "Mur d'enceinte avant entre les 2 tours",
            "couleur": "#8B7355",
            "jointCouleur": "#1A1A1A",
            "x": 0, "y": 0, "z": -3,
            "distance": 12, "hauteur": 2,
            "angle": 0,
            "trous": [
                { "largeur": 3.00, "hauteur": 1.80, "alignement": "center", "mur": 0 }
            ]
        },
        {
            "commentaire": "Pilier entree gauche",
            "couleur": "#555555",
            "jointCouleur": "#333333",
            "x": 4.3, "y": 0, "z": -3.5,
            "distance": 0.50, "hauteur": 2.50,
            "nbCotes": 4
        },
        {
            "commentaire": "Pilier entree droit",
            "couleur": "#555555",
            "jointCouleur": "#333333",
            "x": 7.2, "y": 0, "z": -3.5,
            "distance": 0.50, "hauteur": 2.50,
            "nbCotes": 4
        }
    ]
}
```

### Exemple 3 — Maison Simple (fichier: maison-simple.json)

Rectangle 10m x 8m avec 4 murs individuels, bicolore, 2 murs interieurs, pignons avant/arriere.
Techniques : rectangle avec `angle`, bicolore avec `ignorer`+`priorite`, pignons en escalier.

**ATTENTION :** les murs de base n'ont PAS `priorite: 1` dans cet exemple.
C'est une ERREUR — les couches accent ont `priorite: 2` mais la base n'a pas de priorite.
Cela cause du clignotement. Ajouter `"priorite": 1` sur les 4 murs de base.

```json
{
    "nom": "Maison Simple",
    "murs": [
        {
            "commentaire": "Facade 10m - porte + 2 fenetres",
            "couleur": "#A0522D",
            "jointCouleur": "#D4C5A9",
            "x": 0, "y": 0, "z": 0,
            "distance": 10, "hauteur": 2.70,
            "angle": 0,
            "priorite": 1,
            "trous": [
                { "largeur": 0.90, "hauteur": 2.15, "alignement": "center", "mur": 0 },
                { "y": 0.90, "largeur": 1.20, "hauteur": 1.00, "alignement": "center", "decalage": -3, "mur": 0 },
                { "y": 0.90, "largeur": 1.20, "hauteur": 1.00, "alignement": "center", "decalage": 3, "mur": 0 }
            ]
        },
        {
            "commentaire": "Mur droit 8m - 2 fenetres",
            "couleur": "#A0522D",
            "jointCouleur": "#D4C5A9",
            "x": 10, "y": 0, "z": 0,
            "distance": 8, "hauteur": 2.70,
            "angle": 90,
            "priorite": 1,
            "trous": [
                { "y": 0.90, "largeur": 1.00, "hauteur": 1.00, "alignement": "center", "decalage": -1.5, "mur": 0 },
                { "y": 0.90, "largeur": 1.00, "hauteur": 1.00, "alignement": "center", "decalage": 1.5, "mur": 0 }
            ]
        },
        {
            "commentaire": "Mur arriere 10m - porte secondaire + fenetre",
            "couleur": "#A0522D",
            "jointCouleur": "#D4C5A9",
            "x": 10, "y": 0, "z": 8,
            "distance": 10, "hauteur": 2.70,
            "angle": 180,
            "priorite": 1,
            "trous": [
                { "largeur": 0.83, "hauteur": 2.04, "alignement": "center", "mur": 0 },
                { "y": 0.90, "largeur": 1.00, "hauteur": 1.00, "alignement": "center", "decalage": 3, "mur": 0 }
            ]
        },
        {
            "commentaire": "Mur gauche 8m - 2 fenetres",
            "couleur": "#A0522D",
            "jointCouleur": "#D4C5A9",
            "x": 0, "y": 0, "z": 8,
            "distance": 8, "hauteur": 2.70,
            "angle": 270,
            "priorite": 1,
            "trous": [
                { "y": 0.90, "largeur": 1.00, "hauteur": 1.00, "alignement": "center", "decalage": -1.5, "mur": 0 },
                { "y": 0.90, "largeur": 1.00, "hauteur": 1.00, "alignement": "center", "decalage": 1.5, "mur": 0 }
            ]
        },
        {
            "commentaire": "Facade accent orange — MEMES trous, priorite 2",
            "couleur": "#CD853F",
            "jointCouleur": null,
            "x": 0, "y": 0, "z": 0,
            "distance": 10, "hauteur": 2.70,
            "angle": 0,
            "ignorer": [4, 2],
            "priorite": 2,
            "trous": [
                { "largeur": 0.90, "hauteur": 2.15, "alignement": "center", "mur": 0 },
                { "y": 0.90, "largeur": 1.20, "hauteur": 1.00, "alignement": "center", "decalage": -3, "mur": 0 },
                { "y": 0.90, "largeur": 1.20, "hauteur": 1.00, "alignement": "center", "decalage": 3, "mur": 0 }
            ]
        },
        {
            "commentaire": "Mur droit accent — MEMES trous, priorite 2",
            "couleur": "#CD853F",
            "jointCouleur": null,
            "x": 10, "y": 0, "z": 0,
            "distance": 8, "hauteur": 2.70,
            "angle": 90,
            "ignorer": [4, 2],
            "priorite": 2,
            "trous": [
                { "y": 0.90, "largeur": 1.00, "hauteur": 1.00, "alignement": "center", "decalage": -1.5, "mur": 0 },
                { "y": 0.90, "largeur": 1.00, "hauteur": 1.00, "alignement": "center", "decalage": 1.5, "mur": 0 }
            ]
        },
        {
            "commentaire": "Mur arriere accent — MEMES trous, priorite 2",
            "couleur": "#CD853F",
            "jointCouleur": null,
            "x": 10, "y": 0, "z": 8,
            "distance": 10, "hauteur": 2.70,
            "angle": 180,
            "ignorer": [4, 2],
            "priorite": 2,
            "trous": [
                { "largeur": 0.83, "hauteur": 2.04, "alignement": "center", "mur": 0 },
                { "y": 0.90, "largeur": 1.00, "hauteur": 1.00, "alignement": "center", "decalage": 3, "mur": 0 }
            ]
        },
        {
            "commentaire": "Mur gauche accent — MEMES trous, priorite 2",
            "couleur": "#CD853F",
            "jointCouleur": null,
            "x": 0, "y": 0, "z": 8,
            "distance": 8, "hauteur": 2.70,
            "angle": 270,
            "ignorer": [4, 2],
            "priorite": 2,
            "trous": [
                { "y": 0.90, "largeur": 1.00, "hauteur": 1.00, "alignement": "center", "decalage": -1.5, "mur": 0 },
                { "y": 0.90, "largeur": 1.00, "hauteur": 1.00, "alignement": "center", "decalage": 1.5, "mur": 0 }
            ]
        },
        {
            "commentaire": "Mur interieur gauche (x=3.5) — cloison avec porte",
            "couleur": "#C4A882",
            "jointCouleur": "#D4C5A9",
            "x": 3.5, "y": 0, "z": 0,
            "distance": 8, "hauteur": 2.70,
            "angle": 90,
            "trous": [
                { "largeur": 0.83, "hauteur": 2.04, "alignement": "center", "mur": 0 }
            ]
        },
        {
            "commentaire": "Mur interieur droit (x=6.5) — cloison avec porte",
            "couleur": "#C4A882",
            "jointCouleur": "#D4C5A9",
            "x": 6.5, "y": 0, "z": 0,
            "distance": 8, "hauteur": 2.70,
            "angle": 90,
            "trous": [
                { "largeur": 0.83, "hauteur": 2.04, "alignement": "center", "mur": 0 }
            ]
        },
        {
            "commentaire": "Pignon avant — 5 etapes en escalier",
            "couleur": "#A0522D", "jointCouleur": "#D4C5A9",
            "x": 0.75, "y": 2.70, "z": 0, "distance": 8.50, "hauteur": 0.50, "angle": 0
        },
        { "couleur": "#A0522D", "jointCouleur": "#D4C5A9",
            "x": 1.75, "y": 3.20, "z": 0, "distance": 6.50, "hauteur": 0.50, "angle": 0 },
        { "couleur": "#A0522D", "jointCouleur": "#D4C5A9",
            "x": 2.75, "y": 3.70, "z": 0, "distance": 4.50, "hauteur": 0.50, "angle": 0 },
        { "couleur": "#A0522D", "jointCouleur": "#D4C5A9",
            "x": 3.75, "y": 4.20, "z": 0, "distance": 2.50, "hauteur": 0.50, "angle": 0 },
        { "couleur": "#A0522D", "jointCouleur": "#D4C5A9",
            "x": 4.50, "y": 4.70, "z": 0, "distance": 1.00, "hauteur": 0.30, "angle": 0 },
        {
            "commentaire": "Pignon arriere — meme chose a z=8",
            "couleur": "#A0522D", "jointCouleur": "#D4C5A9",
            "x": 0.75, "y": 2.70, "z": 8, "distance": 8.50, "hauteur": 0.50, "angle": 0
        },
        { "couleur": "#A0522D", "jointCouleur": "#D4C5A9",
            "x": 1.75, "y": 3.20, "z": 8, "distance": 6.50, "hauteur": 0.50, "angle": 0 },
        { "couleur": "#A0522D", "jointCouleur": "#D4C5A9",
            "x": 2.75, "y": 3.70, "z": 8, "distance": 4.50, "hauteur": 0.50, "angle": 0 },
        { "couleur": "#A0522D", "jointCouleur": "#D4C5A9",
            "x": 3.75, "y": 4.20, "z": 8, "distance": 2.50, "hauteur": 0.50, "angle": 0 },
        { "couleur": "#A0522D", "jointCouleur": "#D4C5A9",
            "x": 4.50, "y": 4.70, "z": 8, "distance": 1.00, "hauteur": 0.30, "angle": 0 }
    ]
}
```

### Exemple 4 — Chateau de la Princesse (fichier: chateau-princesse.json)

Chateau complet avec 3 niveaux en escalier, 4 tours d'angle, tour centrale,
creneaux sur toutes les terrasses, bicolore avec briques verticales dorees.
Le fichier fait 500+ lignes — voir `constructions/chateau-princesse.json`.

**Structure du chateau :**
- Niveau 1 : 15m x 15m, h=3m, nbCotes=4 + creneaux + bicolore ocre
- Niveau 2 : 11m x 11m, h=2.5m a y=3, nbCotes=4 + creneaux
- Niveau 3 : 7m x 7m, h=2m a y=5.5, nbCotes=4 + creneaux
- Tour centrale : 3m x 3m, h=5m a y=7.5 + briques verticales dorees + creneaux
- 4 tours d'angle : 2.5m x 2.5m, h=8m aux 4 coins + creneaux
- 2 piliers d'entree : 0.6m x 0.6m, h=3.5m

**Techniques utilisees :**
- `nbCotes: 4` pour chaque niveau et chaque tour
- Niveaux empiles : y augmente a chaque niveau, retrait de 2m par cote
- Creneaux : mur de 0.60m avec trous espaces de 1.50m sur les 4 cotes
- Bicolore : ignorer [3, 2] + priorite 2 pour l'ocre sur niveau 1
- Briques verticales : vertical=true + ignorer [4, 1] + priorite 2 sur tour centrale
- Tours d'angle : position en debord (-1m) aux 4 coins du niveau 1

### Exemple 5 — Maison 80m2 (fichier: maison-80m2.json)

Maison rectangulaire 10m x 8m avec salon, 2 chambres, SdB, WC, bicolore et pignons.

Maison de 10m x 8m avec salon, 2 chambres, SdB, WC, bicolore et pignons.
Utilise 4 murs individuels avec `angle` car c'est un RECTANGLE (pas un carre).

**Plan au sol :**

```
z=8  ___________________________________
     |                  |               |
     |   Chambre 1      |  Chambre 2   |
     |   5.5 x 3.5      |  4.5 x 3.5  |
     |   = 19m2         |  = 16m2     |
z=4.5|____porte_________|___porte______|
     |             | SdB              |
     |             | 3 x 2.5 = 7.5m2 |
     |   Salon     |_porte____________|
     |  7 x 4.5   |WC   |            |
     |  = 31.5m2  |1.5x2|            |
     |____porte___|porte_|____________|
z=0
x=0          x=7 x=8.5            x=10
```

**JSON complet :**

```json
{
    "nom": "Maison 80m2",
    "murs": [
        {
            "commentaire": "Facade 10m - porte entree + fenetre salon + petite fenetre WC",
            "couleur": "#A0522D",
            "jointCouleur": "#D4C5A9",
            "x": 0, "y": 0, "z": 0,
            "distance": 10, "hauteur": 2.70,
            "angle": 0,
            "priorite": 1,
            "trous": [
                { "largeur": 0.90, "hauteur": 2.15, "alignement": "center", "decalage": -1.5, "mur": 0 },
                { "y": 0.90, "largeur": 1.20, "hauteur": 1.00, "alignement": "center", "decalage": -3.5, "mur": 0 },
                { "y": 1.60, "largeur": 0.60, "hauteur": 0.60, "alignement": "center", "decalage": 2.5, "mur": 0 }
            ]
        },
        {
            "commentaire": "Mur droit 8m",
            "couleur": "#A0522D",
            "jointCouleur": "#D4C5A9",
            "x": 10, "y": 0, "z": 0,
            "distance": 8, "hauteur": 2.70,
            "angle": 90,
            "priorite": 1,
            "trous": [
                { "y": 1.20, "largeur": 0.80, "hauteur": 0.80, "alignement": "center", "decalage": -1.5, "mur": 0 },
                { "y": 0.90, "largeur": 1.00, "hauteur": 1.00, "alignement": "center", "decalage": 2, "mur": 0 }
            ]
        },
        {
            "commentaire": "Mur arriere 10m",
            "couleur": "#A0522D",
            "jointCouleur": "#D4C5A9",
            "x": 10, "y": 0, "z": 8,
            "distance": 10, "hauteur": 2.70,
            "angle": 180,
            "priorite": 1,
            "trous": [
                { "y": 0.90, "largeur": 1.20, "hauteur": 1.00, "alignement": "center", "decalage": 2, "mur": 0 },
                { "y": 0.90, "largeur": 1.00, "hauteur": 1.00, "alignement": "center", "decalage": -2.5, "mur": 0 }
            ]
        },
        {
            "commentaire": "Mur gauche 8m",
            "couleur": "#A0522D",
            "jointCouleur": "#D4C5A9",
            "x": 0, "y": 0, "z": 8,
            "distance": 8, "hauteur": 2.70,
            "angle": 270,
            "priorite": 1,
            "trous": [
                { "y": 0.90, "largeur": 1.00, "hauteur": 1.00, "alignement": "center", "decalage": -2, "mur": 0 },
                { "y": 0.90, "largeur": 1.20, "hauteur": 1.00, "alignement": "center", "decalage": 2, "mur": 0 }
            ]
        },
        {
            "commentaire": "Facade accent orange — MEMES trous, priorite 2",
            "couleur": "#CD853F",
            "jointCouleur": null,
            "x": 0, "y": 0, "z": 0,
            "distance": 10, "hauteur": 2.70,
            "angle": 0,
            "ignorer": [5, 2],
            "priorite": 2,
            "trous": [
                { "largeur": 0.90, "hauteur": 2.15, "alignement": "center", "decalage": -1.5, "mur": 0 },
                { "y": 0.90, "largeur": 1.20, "hauteur": 1.00, "alignement": "center", "decalage": -3.5, "mur": 0 },
                { "y": 1.60, "largeur": 0.60, "hauteur": 0.60, "alignement": "center", "decalage": 2.5, "mur": 0 }
            ]
        },
        {
            "commentaire": "Mur droit accent — MEMES trous, priorite 2",
            "couleur": "#CD853F",
            "jointCouleur": null,
            "x": 10, "y": 0, "z": 0,
            "distance": 8, "hauteur": 2.70,
            "angle": 90,
            "ignorer": [5, 2],
            "priorite": 2,
            "trous": [
                { "y": 1.20, "largeur": 0.80, "hauteur": 0.80, "alignement": "center", "decalage": -1.5, "mur": 0 },
                { "y": 0.90, "largeur": 1.00, "hauteur": 1.00, "alignement": "center", "decalage": 2, "mur": 0 }
            ]
        },
        {
            "commentaire": "Mur arriere accent — MEMES trous, priorite 2",
            "couleur": "#CD853F",
            "jointCouleur": null,
            "x": 10, "y": 0, "z": 8,
            "distance": 10, "hauteur": 2.70,
            "angle": 180,
            "ignorer": [5, 2],
            "priorite": 2,
            "trous": [
                { "y": 0.90, "largeur": 1.20, "hauteur": 1.00, "alignement": "center", "decalage": 2, "mur": 0 },
                { "y": 0.90, "largeur": 1.00, "hauteur": 1.00, "alignement": "center", "decalage": -2.5, "mur": 0 }
            ]
        },
        {
            "commentaire": "Mur gauche accent — MEMES trous, priorite 2",
            "couleur": "#CD853F",
            "jointCouleur": null,
            "x": 0, "y": 0, "z": 8,
            "distance": 8, "hauteur": 2.70,
            "angle": 270,
            "ignorer": [5, 2],
            "priorite": 2,
            "trous": [
                { "y": 0.90, "largeur": 1.00, "hauteur": 1.00, "alignement": "center", "decalage": -2, "mur": 0 },
                { "y": 0.90, "largeur": 1.20, "hauteur": 1.00, "alignement": "center", "decalage": 2, "mur": 0 }
            ]
        },
        {
            "commentaire": "Cloison z=4.5 (salon/chambres) — 2 portes",
            "couleur": "#C4A882",
            "jointCouleur": "#D4C5A9",
            "x": 0, "y": 0, "z": 4.5,
            "distance": 10, "hauteur": 2.70,
            "angle": 0,
            "trous": [
                { "largeur": 0.83, "hauteur": 2.04, "alignement": "center", "decalage": -2.5, "mur": 0 },
                { "largeur": 0.83, "hauteur": 2.04, "alignement": "center", "decalage": 3, "mur": 0 }
            ]
        },
        {
            "commentaire": "Cloison x=5.5 (entre chambres) — pas de porte",
            "couleur": "#C4A882",
            "jointCouleur": "#D4C5A9",
            "x": 5.5, "y": 0, "z": 4.5,
            "distance": 3.5, "hauteur": 2.70,
            "angle": 90
        },
        {
            "commentaire": "Cloison x=7 (salon/zone eau) — 1 porte",
            "couleur": "#C4A882",
            "jointCouleur": "#D4C5A9",
            "x": 7, "y": 0, "z": 0,
            "distance": 4.5, "hauteur": 2.70,
            "angle": 90,
            "trous": [
                { "largeur": 0.73, "hauteur": 2.04, "alignement": "center", "decalage": 0.5, "mur": 0 }
            ]
        },
        {
            "commentaire": "Cloison z=2 (WC/SdB) — 1 petite porte",
            "couleur": "#C4A882",
            "jointCouleur": "#D4C5A9",
            "x": 7, "y": 0, "z": 2,
            "distance": 3, "hauteur": 2.70,
            "angle": 0,
            "trous": [
                { "largeur": 0.63, "hauteur": 2.04, "alignement": "start", "decalage": 0.2, "mur": 0 }
            ]
        },
        {
            "commentaire": "Cloison x=8.5 (WC tout petit)",
            "couleur": "#C4A882",
            "jointCouleur": "#D4C5A9",
            "x": 8.5, "y": 0, "z": 0,
            "distance": 2, "hauteur": 2.70,
            "angle": 90
        },
        {
            "commentaire": "Pignon gauche (x=0) — 5 etapes",
            "couleur": "#A0522D", "jointCouleur": "#D4C5A9",
            "x": 0, "y": 2.70, "z": 0.5, "distance": 7.0, "hauteur": 0.50, "angle": 90
        },
        {
            "couleur": "#A0522D", "jointCouleur": "#D4C5A9",
            "x": 0, "y": 3.20, "z": 1.25, "distance": 5.5, "hauteur": 0.50, "angle": 90
        },
        {
            "couleur": "#A0522D", "jointCouleur": "#D4C5A9",
            "x": 0, "y": 3.70, "z": 2.0, "distance": 4.0, "hauteur": 0.50, "angle": 90
        },
        {
            "couleur": "#A0522D", "jointCouleur": "#D4C5A9",
            "x": 0, "y": 4.20, "z": 2.75, "distance": 2.5, "hauteur": 0.50, "angle": 90
        },
        {
            "couleur": "#A0522D", "jointCouleur": "#D4C5A9",
            "x": 0, "y": 4.70, "z": 3.25, "distance": 1.5, "hauteur": 0.30, "angle": 90
        },
        {
            "commentaire": "Pignon droit (x=10) — meme chose",
            "couleur": "#A0522D", "jointCouleur": "#D4C5A9",
            "x": 10, "y": 2.70, "z": 0.5, "distance": 7.0, "hauteur": 0.50, "angle": 90
        },
        {
            "couleur": "#A0522D", "jointCouleur": "#D4C5A9",
            "x": 10, "y": 3.20, "z": 1.25, "distance": 5.5, "hauteur": 0.50, "angle": 90
        },
        {
            "couleur": "#A0522D", "jointCouleur": "#D4C5A9",
            "x": 10, "y": 3.70, "z": 2.0, "distance": 4.0, "hauteur": 0.50, "angle": 90
        },
        {
            "couleur": "#A0522D", "jointCouleur": "#D4C5A9",
            "x": 10, "y": 4.20, "z": 2.75, "distance": 2.5, "hauteur": 0.50, "angle": 90
        },
        {
            "couleur": "#A0522D", "jointCouleur": "#D4C5A9",
            "x": 10, "y": 4.70, "z": 3.25, "distance": 1.5, "hauteur": 0.30, "angle": 90
        }
    ]
}
```

---

## Conseils pour generer un JSON de qualite

1. **Commencer par le plan au sol** — dessiner les pieces avec leurs dimensions
2. **Carre = nbCotes, rectangle = 4 murs** — ne jamais confondre
3. **Utiliser 'center' + decalage** — plus fiable que calculer x manuellement
4. **Bicolore = dupliquer chaque mur** — meme position + ignorer + priorite + memes trous
5. **Murs interieurs** — couleur claire, portes interieures, angle 0 ou 90
6. **Pignons** — 5 etapes en escalier, toujours par paire
7. **Creneaux** — mur de 0.60m avec trous espaces de 1.50m
8. **Niveaux empiles** — y = somme des hauteurs precedentes
9. **Commenter chaque element** — utiliser le champ `commentaire`
10. **Valider le JSON** — pas de virgule finale, guillemets doubles
