# bokonzifr (Luvumbu 2) - Documentation du Projet

## 1. Presentation generale

**Nom du projet :** bokonzifr
**Nom technique :** Luvumbu 2
**Type :** Application web full-stack de planification d'installations electriques
**Domaine :** bokonzi.fr (production) / localhost (developpement)
**Statut :** Production-ready

L'application combine deux composants principaux :
1. **Systeme d'authentification** - Google OAuth 2.0 + login administrateur
2. **ELEEC App** - Planificateur d'installations electriques avec visualisation 3D

---

## 2. Stack technique

| Couche | Technologie |
|--------|-------------|
| Backend | PHP 8+ avec MySQLi (requetes preparees) |
| Serveur | Apache (XAMPP en local) |
| Base de donnees | MySQL avec InnoDB, UTF-8mb4 |
| Frontend | HTML5 / CSS3 / JavaScript vanilla (ES6+) |
| 3D | Three.js r128 (CDN) + OrbitControls |
| OAuth | Google OAuth 2.0 |
| Dependances externes | Three.js uniquement |
| Dependances internes | Aucune (zero npm / zero composer) |

---

## 3. Architecture des fichiers

```
luvumbu_2/
├── index.php                        # Point d'entree (routeur d'authentification)
├── config.php                       # Configuration globale (DB + OAuth + init)
├── .credentials.php                 # Identifiants DB (auto-cree, auto-supprime si invalide)
├── .google_oauth.php                # Cles Google OAuth (permanent)
├── .htaccess                        # Protection HTTP des fichiers sensibles
│
├── auth/
│   ├── login.php                    # Page de connexion (3 modes : setup, Google, admin)
│   ├── callback.php                 # Callback Google OAuth
│   └── logout.php                   # Destruction de session
│
├── pages/
│   └── dashboard.php                # Tableau de bord utilisateur (protege)
│
├── app/                             # Application ELEEC
│   ├── index.php                    # Page principale (wizard 6 etapes)
│   ├── README.md                    # Documentation ELEEC
│   ├── js/
│   │   ├── app.js                   # Navigation wizard + appareils
│   │   ├── grid.js                  # Editeur grille 2D, pieces, murs, equipements
│   │   └── view3d.js                # Rendu 3D Three.js (~1400 lignes)
│   ├── css/
│   │   └── style.css                # Styles ELEEC (~940 lignes)
│   └── test/
│       ├── index.html               # Interface de tests
│       ├── test.js                   # Tests navigateur
│       ├── run-tests.js             # Suite de tests Node.js
│       └── test-data.json           # Donnees de test (maison 3 etages)
│
├── css/
│   ├── login.css                    # Styles page de connexion
│   └── dashboard.css                # Styles tableau de bord
│
├── js/
│   └── login.js                     # Toggle formulaire admin
│
├── sql/
│   ├── config_sql.php               # Fonction initDatabase()
│   ├── login_sql.php                # Fonction adminLogin()
│   └── callback_sql.php             # Fonction upsertGoogleUser()
│
├── Class/
│   ├── DatabaseHandler.php          # ORM maison (36 methodes, ~980 lignes)
│   ├── DatabaseHandler_tests.php    # 79 tests API
│   └── DatabaseHandler_tests_front.php  # Interface HTML de tests
│
├── admin/
│   └── setup_bdd.php                # Configuration manuelle de la DB
│
├── docs/
│   ├── PROJET.md                    # Ce fichier
│   ├── FONCTIONNEMENT.md            # Guide technique (francais)
│   ├── index.php                    # Documentation HTML interactive (admin)
│   ├── DatabaseHandler_exemples.php # Exemples d'utilisation de l'ORM
│   └── DatabaseHandler_tests_doc.php # Documentation des tests
│
└── projet/
    └── eleec/
        ├── index.html               # Version standalone HTML (54 KB)
        └── README.md                # Reference installation electrique
```

---

## 4. Systeme d'authentification

### 4.1 Flux Google OAuth 2.0

```
1. Clic sur "Se connecter avec Google"
2. Redirection vers l'ecran de consentement Google (token CSRF state)
3. Approbation → redirection vers auth/callback.php avec un code
4. callback.php echange le code contre un access_token
5. Recuperation du profil utilisateur via googleapis.com
6. UPSERT dans la table users (id, login_count, last_login)
7. Stockage dans $_SESSION['user']
8. Redirection vers index.php → pages/dashboard.php
```

### 4.2 Flux Admin

```
1. Saisie du nom d'utilisateur / mot de passe
2. Comparaison avec DB_USER et DB_PASS de .credentials.php
3. Si match : adminLogin($conn) fait un upsert du compte admin
4. $_SESSION['user'] avec is_admin = true
5. Redirection vers le dashboard
```

### 4.3 Flux Setup (premier lancement)

```
1. Pas de .credentials.php ? → Affichage du formulaire setup
2. Saisie : nom de la DB, utilisateur, mot de passe
3. Test de connexion MySQL
4. Succes : creation de .credentials.php → redirection vers login
5. Echec : affichage de l'erreur → nouveau essai
6. config.php : si la connexion echoue → suppression de .credentials.php → retour au setup
```

---

## 5. Application ELEEC

### 5.1 Wizard en 6 etapes

| Etape | Description |
|-------|-------------|
| 1 | Nommage du projet |
| 2 | Type de batiment (maison ou appartement) |
| 3 | Configuration des etages et des pieces |
| 4 | Editeur visuel de plan (grille 2D) |
| 5 | Catalogue d'appareils electriques |
| 6 | Generation du rapport final |

### 5.2 Editeur de grille 2D

- Grille de **16 x 12 cellules** par etage
- **9 types de pieces** avec couleurs distinctes :
  - Salon (#4CAF50), Chambre (#2196F3), Cuisine (#FF9800)
  - Salle de bain (#00BCD4), WC (#9C27B0), Couloir (#795548)
  - Cave (#607D8B), Garage (#455A64), Bureau (#E91E63)
- Dessin de pieces rectangulaires par clic-glisser
- **3 orientations de murs** : Auto / Horizontal / Vertical
- **5 types de fenetres** : Simple, Double, Baie vitree, Velux, Oeil-de-boeuf
- Placement de portes et d'equipements (prises, interrupteurs)
- Support multi-etages avec onglets

### 5.3 Visualisation 3D

- Rendu temps reel avec **Three.js**
- Textures de sol colorees par type de piece
- Murs en beton gris avec ombres
- Cadres de portes en bois
- Fenetres en verre avec transparence
- Modeles de prises et interrupteurs electriques
- Controles interactifs : rotation souris, zoom molette
- Selecteur d'etage pour batiments multi-niveaux

### 5.4 Catalogue d'appareils electriques

17 appareils standards avec puissance en watts :

| Appareil | Puissance (W) |
|----------|---------------|
| Prise de courant | 200 |
| Eclairage | 75 |
| Chauffage electrique | 1500 |
| Chauffe-eau | 2000 |
| Four | 2500 |
| Plaque de cuisson | 5000 |
| Refrigerateur | 150 |
| Lave-linge | 2200 |
| Seche-linge | 2500 |
| Television | 100 |
| Ordinateur | 300 |
| Climatisation | 1500 |
| Chaudiere | 500 |
| VMC | 30 |
| Volet roulant | 200 |
| Portail electrique | 300 |
| Alarme | 50 |

### 5.5 Rapport

- Cartes resumees : type de batiment, etages, pieces, appareils, puissance, amperage
- Vue arborescente : projet → etages → pieces → appareils
- Tableau detaille par etage : piece, surface, nombre d'appareils, puissance
- Export impression via `window.print()`

---

## 6. Modele de donnees

### 6.1 Base de donnees - Table `users`

| Colonne | Type | Description |
|---------|------|-------------|
| id | INT (PK, AUTO_INCREMENT) | Identifiant interne |
| google_id | VARCHAR(255) UNIQUE | ID Google ou 'admin' |
| email | VARCHAR(255) UNIQUE | Adresse email |
| email_verified | TINYINT(1) | Verification Google |
| name | VARCHAR(255) | Nom complet |
| given_name | VARCHAR(255) | Prenom |
| family_name | VARCHAR(255) | Nom de famille |
| picture | TEXT | URL de la photo de profil |
| locale | VARCHAR(10) | Langue |
| gender | VARCHAR(20) | Genre |
| hd | VARCHAR(255) | Domaine Google Workspace |
| login_count | INT | Compteur de connexions |
| last_login | DATETIME | Derniere connexion |
| created_at | DATETIME | Date de creation |
| updated_at | DATETIME | Derniere modification |

### 6.2 Modele JavaScript (ELEEC)

```javascript
projet = {
  nom: string,                       // Nom du projet
  type: 'maison' | 'appartement',   // Type de batiment
  etages: [{nom, numero}, ...],      // Liste des etages
  pieces: {floorIdx: {roomKey: {type, cells}}},   // Pieces par etage
  appareils: {roomId: [{nom, watts, icone}...]}    // Appareils par piece
}

Grid = {
  floors: {floorIdx: {roomKey: {type, cells[]}}},
  walls: {floorIdx: {"h_r_c": true}},              // Murs horizontaux
  doors: {floorIdx: {"h_r_c": true}},              // Portes
  windows: {floorIdx: {"h_r_c": "simple"|"double"|"baie"|"velux"|"oeil"}},
  equips: {floorIdx: {"r_c": [{type, icon}...]}},  // Equipements electriques
  wallOrient: 'auto' | 'h' | 'v' | 'd',           // Mode de mur
  windowType: 'simple' | 'double' | 'baie' | 'velux' | 'oeil'
}
```

---

## 7. ORM DatabaseHandler

Classe PHP maison avec **36 methodes** :

| Categorie | Methodes |
|-----------|----------|
| Connexion | `__construct`, `getConnection`, `close` |
| Creation | `createTable`, `createTableFromArray`, `tableExists` |
| Insertion | `insert`, `insertMultiple`, `add` |
| Selection | `select`, `selectWhere`, `first`, `last`, `find`, `findWhere` |
| Recherche | `search`, `searchMultiple`, `has` |
| Jointure | `selectJoin` |
| Mise a jour | `update`, `updateMulti`, `edit` |
| Suppression | `delete`, `deleteBatch`, `truncate`, `dropTable`, `remove` |
| Schema | `addColumn`, `removeColumn`, `getColumns`, `describe` |
| SQL brut | `rawQuery`, `rawSelect` |
| Utilitaires | `count`, `paginate`, `beginTransaction`, `commit`, `rollback` |

Suite de tests : **79 tests** couvrant toutes les methodes.

---

## 8. Securite

| Mesure | Implementation |
|--------|----------------|
| Protection des fichiers sensibles | `.htaccess` bloque `.credentials.php` et `.google_oauth.php` |
| Protection CSRF | Token state dans le flux OAuth |
| Injection SQL | Requetes preparees (prepared statements) partout |
| Sessions | Validation des donnees utilisateur a chaque requete |
| Roles | Flag `is_admin` pour le controle d'acces |
| Credentials | Auto-suppression si connexion invalide |

---

## 9. Design et UI

- **Theme sombre** inspire de GitHub (#0d1117 fond, #6c5ce7 accent)
- **Layouts** : Flexbox et CSS Grid
- **Responsive** : adapte mobile
- **Zero framework CSS** : tout est en CSS vanilla
- **Feuille de style d'impression** pour l'export des rapports

---

## 10. Deploiement

### Local (XAMPP)

1. Placer le projet dans `C:\xampp\htdocs\luvumbu_2`
2. Demarrer Apache + MySQL
3. Acceder a `http://localhost/luvumbu_2`
4. Renseigner les identifiants MySQL dans le formulaire setup
5. (Optionnel) Configurer Google OAuth dans `.google_oauth.php`

### Production

1. Configurer `GOOGLE_REDIRECT_URI` pour `bokonzi.fr` dans `config.php`
2. Configurer OAuth dans la Google Cloud Console
3. Activer `.htaccess` (AllowOverride All)
4. SSL/TLS requis pour le callback OAuth

### Detection d'environnement

- **Local** : `localhost` ou `127.0.0.1`
- **Production** : `bokonzi.fr`
- Commutation automatique des URIs de redirection

---

## 11. Statistiques du projet

| Metrique | Valeur |
|----------|--------|
| Lignes de code totales | ~4 000 |
| JS (app ELEEC) | ~3 300 lignes |
| CSS (app ELEEC) | ~1 000 lignes |
| PHP (backend) | ~1 200 lignes |
| Tables en base | 1 (users) |
| Types de pieces | 9 |
| Appareils au catalogue | 17 |
| Types de fenetres | 5 |
| Resolution de la grille | 16 x 12 cellules |
| Etages max | 10 |
| Dependances externes | 1 (Three.js) |
| Dependances internes | 0 |
| Fichiers | ~34 |
| Taille totale | ~420 Ko |
