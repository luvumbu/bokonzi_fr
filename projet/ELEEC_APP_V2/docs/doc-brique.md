# Classe Brique — Documentation technique complete

## Qu'est-ce que la classe Brique ?

La classe `Brique` permet de construire des murs en briques 3D. Chaque brique est un objet individuel place dans l'espace, comme un lego. La classe gere automatiquement :

- Le placement brique par brique avec joints
- Le motif en quinconce (decalage une rangee sur deux)
- La decoupe aux bords du mur
- Les ouvertures (portes, fenetres) avec alignement automatique
- La construction de formes fermees (carre, rectangle)

---

## Comment creer une instance

```js
var mur = new Brique(sceneManager.scene);
```

Le parametre est la scene Three.js. La classe cree automatiquement un groupe 3D et l'ajoute a la scene.

---

## Dimensions par defaut d'une brique

| Propriete | Valeur | Description |
|---|---|---|
| longueur | 0.22m (22cm) | Largeur visible de la brique |
| hauteur | 0.065m (6.5cm) | Hauteur visible de la brique |
| epaisseur | 0.11m (11cm) | Profondeur de la brique |
| joint | 0.01m (1cm) | Espace entre chaque brique |

**Module L** = longueur + joint = 0.23m (pas horizontal entre 2 briques)
**Module H** = hauteur + joint = 0.075m (pas vertical entre 2 rangees)

---

## Toutes les manieres de creer des briques

### 1. Mur simple — un seul mur droit

```js
var mur = new Brique(sceneManager.scene);
mur.construire(0, 0, 0, 5, 2.50, 0);
// x=0, y=0, z=0, longueur=5m, hauteur=2.50m, angle=0°
```

Resultat : un mur de 5m de long, 2.50m de haut, a l'origine.

---

### 2. Mur avec angle — mur tourne

```js
var mur = new Brique(sceneManager.scene);
mur.construire(0, 0, 0, 5, 2.50, 45);
// angle = 45°
```

Resultat : meme mur mais tourne de 45 degres.

| Angle | Direction |
|---|---|
| 0 | Vers x+ (droite) |
| 90 | Vers z+ (profondeur) |
| 180 | Vers x- (gauche) |
| 270 | Vers z- (devant) |
| 45 | Diagonale |

---

### 3. Carre — 4 murs fermes

```js
var mur = new Brique(sceneManager.scene);
mur.construireForme(0, 0, 0, 5, 2.50, 4, 0);
// x=0, y=0, z=0, cote=5m, hauteur=2.50m, 4 cotes, angle depart=0°
```

Resultat : une piece carree de 5m x 5m.

---

### 4. Forme a N cotes

```js
// 1 mur
mur.construireForme(0, 0, 0, 5, 2.50, 1, 0);

// 2 murs (face a face)
mur.construireForme(0, 0, 0, 5, 2.50, 2, 0);

// 3 murs (en U)
mur.construireForme(0, 0, 0, 5, 2.50, 3, 0);

// 4 murs (carre ferme)
mur.construireForme(0, 0, 0, 5, 2.50, 4, 0);
```

---

### 5. Carre tourne

```js
mur.construireForme(0, 0, 0, 5, 2.50, 4, 45);
// angleDepart = 45° → le carre est tourne de 45 degres
```

---

### 6. Mur avec une porte centree

```js
var mur = new Brique(sceneManager.scene);
mur.ajouterTrou(0, 0, 0.90, 2.15, 'center', 0, 0);
mur.construire(0, 0, 0, 5, 2.50, 0);
```

Resultat : mur de 5m avec une porte de 0.90m x 2.15m centree.

---

### 7. Mur avec une fenetre

```js
var mur = new Brique(sceneManager.scene);
mur.ajouterTrou(0, 0.90, 1.20, 1.20, 'center', 0, 0);
mur.construire(0, 0, 0, 5, 2.50, 0);
```

Resultat : mur avec une fenetre de 1.20m x 1.20m a 0.90m du sol, centree.

---

### 8. Mur avec porte + fenetre

```js
var mur = new Brique(sceneManager.scene);
mur.ajouterTrou(0, 0, 0.90, 2.15, 'center', 0, 0);         // porte
mur.ajouterTrou(0, 0.90, 1.20, 1.20, 'start', 0.3, 0);     // fenetre
mur.construire(0, 0, 0, 5, 2.50, 0);
```

---

### 9. Mur avec porte + 2 fenetres de chaque cote

```js
var mur = new Brique(sceneManager.scene);
mur.ajouterTrou(0, 0, 0.90, 2.15, 'center', 0, 0);         // porte centree
mur.ajouterTrou(0, 0.90, 1.00, 1.00, 'start', 0.3, 0);     // fenetre gauche
mur.ajouterTrou(0, 0.90, 1.00, 1.00, 'end', -0.3, 0);      // fenetre droite
mur.construire(0, 0, 0, 5, 2.50, 0);
```

---

### 10. Carre avec trous sur plusieurs murs

```js
var mur = new Brique(sceneManager.scene);

// Facade (mur 0) : porte + 2 fenetres
mur.ajouterTrou(0, 0, 0.90, 2.15, 'center', 0, 0);
mur.ajouterTrou(0, 0.90, 1.00, 1.00, 'start', 0.3, 0);
mur.ajouterTrou(0, 0.90, 1.00, 1.00, 'end', -0.3, 0);

// Cote droit (mur 1) : 1 fenetre
mur.ajouterTrou(0, 0.90, 1.20, 1.20, 'center', 0, 1);

// Arriere (mur 2) : 2 fenetres
mur.ajouterTrou(0, 0.90, 1.20, 1.20, 'center', -1, 2);
mur.ajouterTrou(0, 0.90, 1.20, 1.20, 'center', 1, 2);

// Gauche (mur 3) : rien

mur.construireForme(0, 0, 0, 5, 2.50, 4, 0);
```

---

### 11. Briques de couleur personnalisee

```js
var mur = new Brique(sceneManager.scene);
mur.setCouleur('#CC6633');          // brique orange
mur.setCouleurJoint('#000000');     // joint noir
mur.construire(0, 0, 0, 5, 2.50, 0);
```

Couleurs possibles : n'importe quel code CSS hex.

---

### 12. Briques verticales (debout)

```js
var mur = new Brique(sceneManager.scene);
mur.setVertical(true);
mur.construire(0, 0, 0, 5, 2.50, 0);
```

Normal : 22cm large x 6.5cm haut
Vertical : 6.5cm large x 22cm haut

---

### 13. Briques avec dimensions personnalisees

```js
var mur = new Brique(sceneManager.scene);
mur.setDimensions(0.30, 0.10, 0.15);  // 30cm x 10cm x 15cm
mur.setJoint(0.02);                    // joint de 2cm
mur.construire(0, 0, 0, 5, 2.50, 0);
```

---

### 14. Briques avec motif (une sur deux)

```js
var mur = new Brique(sceneManager.scene);
mur.setIgnorer(2, false);   // ignore une brique sur 2, commence plein
mur.construire(0, 0, 0, 5, 2.50, 0);
```

| ignorerTousLes | commencerVide | Resultat |
|---|---|---|
| 0 | - | Toutes les briques |
| 2 | false | Plein, vide, plein, vide... |
| 2 | true | Vide, plein, vide, plein... |
| 3 | false | 2 pleines, 1 vide, 2 pleines, 1 vide... |

---

### 15. Deux murs colles — utiliser getPositions

```js
var mur1 = new Brique(sceneManager.scene);
mur1.construire(0, 0, 0, 5, 2.50, 0);

var pos = mur1.getPositions(0, 0, 0, 5, 2.50);

var mur2 = new Brique(sceneManager.scene);
mur2.construire(pos.droite, 0, 0, 3, 2.50, 0);  // colle a droite du mur 1
```

---

### 16. Mur au-dessus d'un autre

```js
var mur1 = new Brique(sceneManager.scene);
mur1.construire(0, 0, 0, 5, 1, 0);

var pos = mur1.getPositions(0, 0, 0, 5, 1);

var mur2 = new Brique(sceneManager.scene);
mur2.setVertical(true);
mur2.construire(pos.gauche, pos.haut, pos.exterieur.z, pos.largeur, 0.5, 0);
```

Resultat : mur horizontal en bas + mur vertical par-dessus.

---

### 17. Mur derriere un autre

```js
var mur1 = new Brique(sceneManager.scene);
mur1.construire(0, 0, 0, 5, 2.50, 0);

var pos = mur1.getPositions(0, 0, 0, 5, 2.50);

var mur2 = new Brique(sceneManager.scene);
mur2.setCouleur('#CC6633');
mur2.construire(pos.derriere.x, pos.derriere.y, pos.derriere.z, 5, 2.50, 0);
```

Resultat : 2 murs colles dos a dos.

---

### 18. Sans joint

```js
var mur = new Brique(sceneManager.scene);
mur.setCouleurJoint(null);           // pas de fond joint
mur.construire(0, 0, 0, 5, 2.50, 0);
```

---

## Reference ajouterTrou

```js
mur.ajouterTrou(x, y, largeur, hauteur, alignement, decalage, murIndex);
```

| Parametre | Type | Description |
|---|---|---|
| x | number | Position horizontale depuis le debut du mur (ignore si alignement) |
| y | number | Position verticale depuis le bas du mur (0 = au sol) |
| largeur | number | Largeur du trou en metres |
| hauteur | number | Hauteur du trou en metres |
| alignement | string/null | 'start', 'center', 'end', 'between', null |
| decalage | number | Decalage en metres apres alignement (+ droite, - gauche) |
| murIndex | number | Sur quel mur (0 = facade, 1 = droite, 2 = arriere, 3 = gauche) |

### Alignement — comment ca marche

```
|←————————— distance du mur ——————————→|

'start'     [TROU]                        colle au debut
'center'          [TROU]                  centre
'end'                          [TROU]     colle a la fin
'between'         [TROU]                  = center (espace egal)
null        position manuelle via x
```

### Alignement + decalage

```
'start', 0.3     →  ___[TROU]            30cm du bord gauche
'end', -0.3      →          [TROU]___    30cm du bord droit
'center', 1      →              [TROU]   centre + 1m a droite
'center', -1     →     [TROU]            centre + 1m a gauche
```

### Index des murs dans construireForme

```
        mur 0 (facade)
    ┌─────────────────┐
    │                 │
mur 3 │               │ mur 1
(gauche)│             │ (droite)
    │                 │
    └─────────────────┘
        mur 2 (arriere)
```

---

## Reference getPositions

```js
var pos = mur.getPositions(x, y, z, distance, hauteur);
```

Retourne un objet avec :

```
pos.exterieur.x / .y / .z     face avant du mur
pos.interieur.x / .y / .z     face arriere du mur
pos.gauche                     bord gauche (x)
pos.droite                     bord droit (x + distance)
pos.bas                        bas du mur (y)
pos.haut                       haut du mur (y + hauteur)
pos.epaisseur                  epaisseur du mur
pos.largeur                    longueur du mur
pos.hauteur                    hauteur du mur
pos.devant.x / .y / .z        position pour coller un objet devant
pos.derriere.x / .y / .z      position pour coller un objet derriere
```

### Schema des positions

```
                   pos.haut
                   ────────
                  │        │
    pos.gauche →  │  MUR   │  ← pos.droite
                  │        │
                   ────────
                   pos.bas

    Vue de dessus :
    ┌──────────────┐ ← pos.devant.z (face exterieure - 0.001)
    │   EPAISSEUR  │
    └──────────────┘ ← pos.derriere.z (face interieure + 0.001)
```

---

## Reference complete des methodes

| Methode | Parametres | Description |
|---|---|---|
| `setCouleur(couleur)` | CSS hex | Couleur des briques |
| `setCouleurJoint(couleur)` | CSS hex ou null | Couleur du joint |
| `setDimensions(l, h, e)` | metres | Dimensions de la brique |
| `setJoint(j)` | metres | Taille du joint |
| `setVertical(val)` | true/false | Briques debout |
| `setIgnorer(tousLes, commencerVide)` | number, bool | Ignorer des briques |
| `ajouterTrou(x, y, l, h, align, dec, mur)` | voir tableau | Ajouter un trou |
| `viderTrous()` | - | Supprimer tous les trous |
| `construire(x, y, z, dist, haut, angle)` | metres, degres | Un seul mur |
| `construire(x, y, z, dist, haut, angle, murIndex)` | + index | Un mur dans une forme |
| `construireForme(x, y, z, dist, haut, nb, angle)` | metres, 1-4, degres | Forme fermee |
| `getPositions(x, y, z, dist, haut)` | metres | Positions des faces |
| `compter()` | - | Nombre de briques |
| `vider()` | - | Tout supprimer |
| `getLongueur()` | - | Longueur brique (0.22m) |
| `getHauteur()` | - | Hauteur brique (0.065m) |
| `getEpaisseur()` | - | Epaisseur brique (0.11m) |
| `getJoint()` | - | Joint (0.01m) |
| `getModuleL()` | - | Pas horizontal (0.23m) |
| `getModuleH()` | - | Pas vertical (0.075m) |

---

## Construction des briques — comment ca marche en interne

### Ordre de construction

Les briques sont posees du **haut vers le bas**. La premiere rangee colle au plafond, puis on descend rang par rang. Cela garantit que la derniere rangee au bord d'un trou est parfaitement alignee.

### Quinconce

Les rangs pairs (0, 2, 4...) commencent a x=0.
Les rangs impairs (1, 3, 5...) sont decales d'une demi-brique (moduleL / 2).

```
Rang 4 : [████][████][████][████][████]
Rang 3 :    [████][████][████][████][██]
Rang 2 : [████][████][████][████][████]
Rang 1 :    [████][████][████][████][██]
Rang 0 : [████][████][████][████][████]
```

### Decoupe aux bords

Les briques qui depassent a gauche ou a droite sont coupees automatiquement. Le rang impair commence par une demi-brique a gauche et finit par une demi-brique a droite.

### Joint

Le joint est un bloc plein (ExtrudeGeometry) de la taille du mur entier, place derriere les briques avec `polygonOffset` pour eviter le Z-fighting. Si des trous sont definis, le joint a des trous (Shape.holes) aux memes endroits.

### Trous

Quand un trou est defini, chaque rangee verifie si elle chevauche le trou. Si oui, la rangee est coupee en sections : avant le trou, apres le trou. Les briques dans le trou ne sont pas posees.
