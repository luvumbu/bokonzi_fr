# Installation Electrique Domestique — Compte Rendu

## 1. Principe general

L'electricite arrive du **reseau EDF** via le compteur **Linky**.
Elle passe ensuite par le **disjoncteur principal 40A** (Block 8) qui protege toute l'installation.
Depuis ce disjoncteur, un **peigne de repartition** distribue le courant vers les 7 disjoncteurs divisionnaires.

```
EDF  ──▶  LINKY  ──▶  Disj. Principal 40A  ──▶  PEIGNE  ──▶  Disjoncteurs 1 a 7
```

---

## 2. Tableau electrique — 8 disjoncteurs

| Block | Amp. | Circuit | Zones alimentees |
|-------|------|---------|------------------|
| 1 | 25A | Puissance chauffe-eau | Cave (ballon eau chaude) |
| 2 | 10A | Commande chauffe-eau | Cave (pilotage heures creuses) |
| 3 | 10A | Eclairage general | RDC + R+1 + R+2 (chambre, dressing, SDB) |
| 4 | 16A | Eclairage escalier + cave | Escalier vers cave + cave |
| 5 | 16A | Prises electriques | RDC (prises + chaudiere) + R+1 (prises) + R+2 (prises chambre) |
| 6 | 20A | Lumiere haut escalier + miroir SDB | R+1 (palier escalier) + R+2 (miroir SDB) |
| 7 | 20A | Circuit inconnu | Non identifie |
| **8** | **40A** | **Disjoncteur principal** | **Toute la maison** |

---

## 3. Description de la maison (4 niveaux)

| Etage | Pieces | Circuits presents |
|-------|--------|-------------------|
| **R+2** | Chambre, Dressing, Salle de bain | Eclairage (B3) dans toutes les pieces, Prises (B5) dans chambre et SDB, Miroir lumineux SDB (B6) |
| **R+1** | Palier escalier | Eclairage (B3), Prises (B5), Lumiere haut escalier (B6) |
| **RDC** | Piece principale / entree | Eclairage (B3), Prises + chaudiere (B5) |
| **Sous-sol** | Cave | Chauffe-eau puissance (B1), Chauffe-eau commande (B2), Eclairage cave (B4) |

---

## 4. Cheminement du circuit prises (Block 5)

Le block 5 alimente **toutes les prises de la maison** ainsi que certains appareils :

```
Block 5 (16A)
├──▶ RDC : prises murales + chaudiere
├──▶ R+1 : prises palier
├──▶ R+2 Chambre : prises
└──▶ R+2 SDB : prises
```

> Si le block 5 est coupe : plus aucune prise dans la maison et la chaudiere s'arrete.

---

## 5. Cheminement du circuit eclairage (Block 3)

Le block 3 est le circuit d'eclairage principal. Il alimente :

```
Block 3 (10A)
├──▶ RDC : eclairage piece principale
├──▶ R+1 : eclairage palier
├──▶ R+2 Chambre : eclairage
├──▶ R+2 Dressing : eclairage
└──▶ R+2 SDB : eclairage
```

Chaque piece dispose d'un **interrupteur simple allumage** (bascule murale) qui permet d'allumer ou eteindre la lumiere localement, sans couper le disjoncteur.

> Attention : l'interrupteur ne fonctionne que si le disjoncteur correspondant est actif. Si le block 3 est coupe, aucun interrupteur ne pourra allumer la lumiere.

---

## 6. Circuit cave et escalier (Block 4)

```
Block 4 (16A)
├──▶ Escalier vers cave : eclairage
└──▶ Cave : eclairage
(Interrupteur simple en haut de l'escalier)
```

---

## 7. Chauffe-eau (Blocks 1 + 2)

Le chauffe-eau necessite **deux circuits** :

- **Block 1 (25A)** : alimentation puissance du ballon (resistance chauffante)
- **Block 2 (10A)** : commande / pilotage (contacteur heures creuses)

> Si l'un des deux est coupe, le chauffe-eau ne fonctionne pas correctement.

---

## 8. Scenarios de coupure

| Action | Consequence |
|--------|-------------|
| Couper EDF (Linky) | Toute la maison sans electricite |
| Couper Block 8 (40A) | Toute la maison sans electricite |
| Couper Block 3 | Plus de lumiere au RDC, R+1 et R+2 (prises OK) |
| Couper Block 4 | Plus de lumiere dans l'escalier et la cave |
| Couper Block 5 | Plus de prises RDC, R+1, R+2 + chaudiere |
| Couper Block 6 | Plus de lumiere en haut de l'escalier R+1 + miroir SDB |
| Couper Blocks 1 ou 2 | Chauffe-eau hors service, pas d'eau chaude |
| Couper Block 3 + 5 | R+2 totalement sans electricite (ni lumiere, ni prises) |

---

## 9. Securite

- Le **disjoncteur principal 40A** protege l'ensemble de l'installation contre les surcharges
- Chaque disjoncteur divisionnaire protege son propre circuit (calibre adapte a la section des cables)
- L'interrupteur mural **ne coupe pas le courant** dans les cables, il coupe uniquement le point lumineux. Pour travailler sur un circuit, il faut **couper le disjoncteur** correspondant au tableau
- Le **Block 7** alimente un circuit non identifie — il est recommande de le tracer pour des raisons de securite
