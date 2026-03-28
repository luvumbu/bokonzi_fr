# bokonzifr — Documentation technique

## Stack technique
- **Backend** : PHP 8+ / MySQL (mysqli) / Apache (XAMPP)
- **Frontend** : HTML/CSS/JS vanilla
- **Serveur local** : XAMPP (C:\xampp\htdocs\dossier_bokonzi_fr)
- **BDD** : `bokonzifr` (auto-creee au premier chargement)
- **Authentification** : Google OAuth 2.0 + login admin (credentials BDD)

---

## Architecture des fichiers

```
dossier_bokonzi_fr/
├── index.php                # Aiguilleur (connecte → dashboard, deconnecte → login)
├── config.php               # Config globale (BDD + Google OAuth + auto-creation tables)
├── .credentials.php         # Identifiants BDD (auto-supprime si invalides)
├── .google_oauth.php        # Cles Google OAuth (permanent, jamais supprime)
├── .htaccess                # Protection fichiers sensibles (HTTP bloque)
├── auth/
│   ├── login.php            # Page de connexion (Setup BDD + Google + Admin)
│   ├── callback.php         # Retour Google OAuth → BDD + session
│   └── logout.php           # Deconnexion (destruction session)
├── pages/
│   └── dashboard.php        # Tableau de bord (page connectee)
├── css/
│   ├── login.css            # Styles page de connexion
│   └── dashboard.css        # Styles tableau de bord
├── js/
│   └── login.js             # JS page de connexion (toggle formulaire admin)
├── sql/
│   ├── config_sql.php       # Creation BDD + table users (initDatabase())
│   ├── login_sql.php        # Requetes admin login (adminLogin())
│   └── callback_sql.php     # Requetes Google upsert (upsertGoogleUser())
├── admin/
│   └── setup_bdd.php        # Creation manuelle BDD (optionnel, acces direct)
├── Class/
│   ├── DatabaseHandler.php       # ORM leger MySQL (36 methodes)
│   ├── DatabaseHandler_tests.php # Tests API JSON (79 tests)
│   └── DatabaseHandler_tests_front.php # Front HTML pour les tests
└── docs/
    ├── index.php                  # Documentation HTML riche (admin only)
    ├── FONCTIONNEMENT.md          # Cette documentation
    ├── DatabaseHandler_exemples.php # Exemples d'utilisation
    ├── DatabaseHandler_tests_doc.php # Documentation des tests
    └── .htaccess                  # Protection docs (sauf index.php)
```

---

## Fichiers de credentials (separation des secrets)

| Fichier | Contenu | Auto-supprime | Cree par |
|---------|---------|---------------|----------|
| `.credentials.php` | DB_HOST, DB_NAME, DB_USER, DB_PASS | Oui (si connexion MySQL echoue ou BDD inexistante) | Formulaire setup (`auth/login.php`) |
| `.google_oauth.php` | GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET | Non (jamais supprime) | Manuel (developpeur) |

### Protection HTTP
Les deux fichiers sont bloques par `.htaccess` :
- Apache 2.4 : `Require all denied`
- Apache 2.2 : `Deny from all`

### Flux de setup automatique
```
.credentials.php absent ?
    │
    ├─ OUI → auth/login.php affiche formulaire setup (3 champs BDD)
    │         → teste connexion MySQL
    │         → si OK : cree .credentials.php → redirige login
    │         → si KO : affiche erreur, garde le formulaire
    │
    └─ NON → config.php charge les credentials
              → try { connexion MySQL + select_db }
              → si exception : supprime .credentials.php → redirige setup
              → si OK : continue normalement
```

---

## Carte des dependances

| Fichier | Depend de | Utilise par |
|---------|-----------|-------------|
| `index.php` | `.credentials.php`, `config.php` | Point d'entree (acces direct) |
| `config.php` | `.credentials.php`, `.google_oauth.php`, `sql/config_sql.php` | `index.php`, `auth/login.php`, `auth/callback.php`, `auth/logout.php`, `pages/dashboard.php`, `admin/setup_bdd.php`, `docs/index.php` |
| `.credentials.php` | Rien (autonome) | `config.php` (require), `auth/login.php` (verification existence) |
| `.google_oauth.php` | Rien (autonome, permanent) | `config.php` (require) |
| `auth/login.php` | `.credentials.php`, `config.php`, `sql/login_sql.php`, `css/login.css`, `js/login.js` | `index.php` (redirect si deconnecte), `auth/logout.php` (redirect) |
| `auth/callback.php` | `config.php`, `sql/callback_sql.php` | Google (redirect apres authentification) |
| `auth/logout.php` | `config.php` | `pages/dashboard.php` (bouton deconnecter) |
| `pages/dashboard.php` | `config.php`, `css/dashboard.css` | `index.php` (redirect si connecte) |
| `admin/setup_bdd.php` | `config.php` | Acces direct (admin) |
| `css/login.css` | Rien (autonome) | `auth/login.php` |
| `css/dashboard.css` | Rien (autonome) | `pages/dashboard.php` |
| `js/login.js` | `auth/login.php` (elements HTML : `.admin-toggle`, `#adminForm`) | `auth/login.php` |
| `sql/config_sql.php` | `config.php` (`$conn`, `DB_NAME`) | `config.php` |
| `sql/login_sql.php` | `config.php` (`$conn`) | `auth/login.php` |
| `sql/callback_sql.php` | `config.php` (`$conn`) | `auth/callback.php` |
| `Class/DatabaseHandler.php` | Rien (autonome, necessite mysqli) | `Class/DatabaseHandler_tests.php`, `docs/DatabaseHandler_exemples.php` |
| `docs/index.php` | `config.php`, `.credentials.php` | Navigateur (admin uniquement) |

---

## Flux d'authentification

### Connexion Google OAuth 2.0
Disponible uniquement si `.google_oauth.php` existe avec des cles non vides.

```
Utilisateur
    │
    ▼
auth/login.php ──── clic bouton Google ────►  Google (accounts.google.com)
                                                       │
                                                       ▼
                                               Ecran consentement Google
                                                       │
                                                       ▼ (code + state)
auth/callback.php ◄─────────── redirect ───────────────┘
    │
    ├─ 1. Verifie state CSRF (compare avec $_SESSION)
    ├─ 2. Echange code → access_token (POST googleapis.com/token)
    ├─ 3. Recupere infos user (GET googleapis.com/userinfo)
    ├─ 4. INSERT ou UPDATE en BDD (sql/callback_sql.php)
    ├─ 5. Incremente login_count
    ├─ 6. Stocke tout en $_SESSION['user']
    │
    ▼
index.php → redirect → pages/dashboard.php
```

### Connexion Admin

```
Utilisateur
    │
    ▼
auth/login.php ──── formulaire username/password
    │
    ├─ Compare avec DB_USER et DB_PASS (credentials BDD depuis .credentials.php)
    ├─ Si OK : INSERT ou UPDATE admin en BDD (sql/login_sql.php)
    ├─ Incremente login_count
    ├─ $_SESSION['user']['is_admin'] = true
    │
    ▼
index.php → redirect → pages/dashboard.php
```

### Deconnexion

```
pages/dashboard.php ──── clic "Se deconnecter"
    │
    ▼
auth/logout.php
    │
    ├─ session_destroy()
    │
    ▼
auth/login.php
```

---

## Base de donnees

### Configuration
Les credentials BDD sont dans `.credentials.php`, les credentials Google dans `.google_oauth.php`.

| Parametre | Fichier source | Cle |
|-----------|---------------|-----|
| Host | `.credentials.php` | `DB_HOST` |
| Nom BDD | `.credentials.php` | `DB_NAME` |
| Utilisateur | `.credentials.php` | `DB_USER` |
| Mot de passe | `.credentials.php` | `DB_PASS` |
| Client ID Google | `.google_oauth.php` | `GOOGLE_CLIENT_ID` |
| Client Secret Google | `.google_oauth.php` | `GOOGLE_CLIENT_SECRET` |
| Charset | `config.php` | `utf8mb4` (en dur) |
| Collation | `sql/config_sql.php` | `utf8mb4_unicode_ci` (en dur) |

### Auto-creation
La BDD et la table `users` sont creees automatiquement au premier chargement de n'importe quelle page (via `config.php` → `sql/config_sql.php` → `initDatabase()`). Pas besoin d'executer `admin/setup_bdd.php` manuellement.

### Auto-suppression credentials
Si la connexion MySQL echoue (user/pass incorrects) ou si la BDD n'existe pas (`select_db` echoue), `config.php` supprime `.credentials.php` et redirige vers le formulaire setup. `mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT)` garantit que les erreurs sont catchables sur tous les serveurs (XAMPP + Hostinger).

### Table `users`

| Colonne | Type | Contrainte | Description |
|---------|------|------------|-------------|
| `id` | INT | PK, AUTO_INCREMENT | ID interne |
| `google_id` | VARCHAR(255) | UNIQUE, NOT NULL | ID Google (ou 'admin' pour l'admin) |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Email Google (ou 'admin@local') |
| `email_verified` | TINYINT(1) | DEFAULT 0 | Email verifie par Google (0/1) |
| `name` | VARCHAR(255) | DEFAULT '' | Nom complet |
| `given_name` | VARCHAR(255) | DEFAULT '' | Prenom |
| `family_name` | VARCHAR(255) | DEFAULT '' | Nom de famille |
| `picture` | TEXT | DEFAULT NULL | URL photo de profil Google |
| `locale` | VARCHAR(10) | DEFAULT '' | Langue (fr, en...) |
| `gender` | VARCHAR(20) | DEFAULT '' | Genre (pas toujours rempli par Google) |
| `hd` | VARCHAR(255) | DEFAULT '' | Domaine Google Workspace (si applicable) |
| `login_count` | INT | DEFAULT 0 | Nombre total de connexions |
| `last_login` | DATETIME | DEFAULT NULL | Date/heure derniere connexion |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Date inscription |
| `updated_at` | DATETIME | ON UPDATE CURRENT_TIMESTAMP | Derniere mise a jour |

---

## Google OAuth 2.0

### Credentials
Les credentials Google sont stockes dans `.google_oauth.php` (fichier permanent, jamais supprime).

| Parametre | Source |
|-----------|--------|
| Client ID | `.google_oauth.php` → `GOOGLE_CLIENT_ID` |
| Client Secret | `.google_oauth.php` → `GOOGLE_CLIENT_SECRET` |
| Redirect URI | Auto-detecte (local/prod) dans `config.php` |
| Scopes | `openid`, `email`, `profile` |
| Projet Google Cloud | `bokonzifr` |

### Activation conditionnelle
Le bouton Google n'apparait sur `auth/login.php` **que si** :
1. `.google_oauth.php` existe
2. `GOOGLE_CLIENT_ID` est non vide

Si ces conditions ne sont pas remplies, seul le formulaire admin est affiche (visible directement, pas cache).

### Donnees recuperees depuis Google
| Champ Google | Colonne BDD | Description |
|--------------|-------------|-------------|
| `id` | `google_id` | ID Google unique |
| `email` | `email` | Adresse email |
| `verified_email` | `email_verified` | Email verifie (true/false → 1/0) |
| `name` | `name` | Nom complet |
| `given_name` | `given_name` | Prenom |
| `family_name` | `family_name` | Nom de famille |
| `picture` | `picture` | URL photo de profil |
| `locale` | `locale` | Langue preferee |
| `gender` | `gender` | Genre |
| `hd` | `hd` | Domaine Google Workspace |

### Securite OAuth
- **State CSRF** : token aleatoire (`bin2hex(random_bytes(16))`) stocke en session, verifie au retour
- **Authorization Code Flow** : tout cote serveur, pas de token client-side
- **Prompt** : `consent` (redemande toujours le consentement)

---

## Login Admin

### Fonctionnement
- Si Google est configure : le formulaire admin est cache, visible via le lien "Connexion administrateur"
- Si Google n'est PAS configure : le formulaire admin est affiche directement (seule option)
- Les identifiants sont compares avec `DB_USER` et `DB_PASS` (depuis `.credentials.php` via `config.php`)
- Valeurs par defaut XAMPP : username = `root`, password = (vide)
- Les champs peuvent etre vides (pas de `required`)
- Message d'erreur rouge si identifiants incorrects
- L'admin est stocke en BDD comme un utilisateur normal (google_id = 'admin', email = 'admin@local')
- `$_SESSION['user']['is_admin'] = true` pour differencier des utilisateurs Google

### Compteur de connexions
- Chaque connexion (Google ou Admin) incremente `login_count` dans la table `users`
- La date/heure est enregistree dans `last_login`
- Le compteur est affiche sur le dashboard avec un badge violet

---

## Session PHP

### Donnees stockees dans `$_SESSION['user']`
| Cle | Type | Description |
|-----|------|-------------|
| `id` | int | ID interne BDD |
| `google_id` | string | ID Google ou 'admin' |
| `email` | string | Email |
| `name` | string | Nom complet |
| `given_name` | string | Prenom |
| `family_name` | string | Nom de famille |
| `picture` | string | URL photo (vide pour admin) |
| `locale` | string | Langue |
| `login_count` | int | Nombre de connexions |
| `is_admin` | bool | true seulement pour le login admin |

### Protection des pages
- `pages/dashboard.php` : si `$_SESSION['user']` n'existe pas → redirect vers `auth/login.php`
- `auth/login.php` : si `$_SESSION['user']` existe → redirect vers `index.php`
- `index.php` : redirige automatiquement selon l'etat de connexion

### Gestion session_start()
`config.php` utilise `if (session_status() === PHP_SESSION_NONE) { session_start(); }` pour eviter l'erreur "session already active" quand il est inclus par un fichier qui a deja demarre la session.

---

## Fonctions SQL

### `initDatabase($conn)` — `sql/config_sql.php`
- Cree la BDD nommee par `DB_NAME` si elle n'existe pas
- Cree la table `users` si elle n'existe pas
- Appelee a chaque chargement de page via `config.php`

### `adminLogin($conn)` — `sql/login_sql.php`
- Cherche l'admin en BDD (`WHERE email = 'admin@local'`)
- Si existe : incremente `login_count`, met a jour `last_login`
- Si n'existe pas : cree l'entree admin (google_id = 'admin')
- Retourne `['id' => int, 'login_count' => int]`

### `upsertGoogleUser($conn, $userData)` — `sql/callback_sql.php`
- Cherche l'utilisateur par `google_id`
- Si existe : UPDATE toutes les infos + incremente `login_count`
- Si n'existe pas : INSERT avec `login_count = 1`
- Retourne `['id' => int, 'login_count' => int]`

---

## Pages et interface

### Page de connexion (`auth/login.php`) — 3 modes

| Mode | Condition | Affichage |
|------|-----------|-----------|
| Setup | `.credentials.php` absent | Formulaire 3 champs (db_name, db_user, db_pass) |
| Connexion complete | `.credentials.php` + `.google_oauth.php` OK | Bouton Google + "ou" + toggle admin |
| Connexion admin seul | `.credentials.php` OK, pas de Google | Formulaire admin affiche directement |

- Theme sombre (#0d1117)
- Message d'erreur rouge si identifiants incorrects

### Tableau de bord (`pages/dashboard.php`)
- Photo de profil Google (arrondie, 80x80)
- Nom + email
- Tableau d'informations : nom complet, prenom, nom de famille, email, langue, Google ID
- Badge violet avec le nombre de connexions
- Bouton rouge "Se deconnecter"

---

## DatabaseHandler (Class/)

ORM leger MySQL avec 36 methodes. Documentation complete dans `docs/DatabaseHandler_exemples.php`.

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

### Tests
- **79 tests** couvrant les 36 methodes (11 sections)
- **API** : `Class/DatabaseHandler_tests.php` (retourne JSON)
- **Front** : `Class/DatabaseHandler_tests_front.php` (interface HTML)
- **Doc** : `docs/DatabaseHandler_tests_doc.php` (logique de chaque test)

---

## Convention de commentaires (en-tete fichiers)

Chaque fichier du projet contient un en-tete avec :
1. **Description** : role du fichier en 1 ligne
2. **Depend de** : fichiers necessaires a son fonctionnement
3. **Utilise par** : fichiers qui l'appellent
4. **Tableau** : mini-tableau ASCII des elements cles du fichier

Exemple PHP :
```php
<?php
// Page de connexion — Setup BDD + Google OAuth + Admin
// Depend de : .credentials.php, .google_oauth.php (via config.php), config.php, sql/login_sql.php
// Utilise par : index.php (redirection si deconnecte), auth/logout.php
//
// +-------------------------+--------------------------------------------------+
// | Mode                    | Condition                                        |
// +-------------------------+--------------------------------------------------+
// | Setup (formulaire BDD)  | .credentials.php absent                          |
// | Connexion Google        | .google_oauth.php present + cles non vides       |
// | Connexion Admin         | .credentials.php present (DB_USER / DB_PASS)     |
// +-------------------------+--------------------------------------------------+
```

Exemple CSS :
```css
/* Styles page de connexion
   Depend de : rien (fichier autonome)
   Utilise par : auth/login.php

   +---------------------+-------------------------------+
   | Classe              | Element                       |
   +---------------------+-------------------------------+
   | .login-box          | Conteneur principal           |
   | .btn-google         | Bouton connexion Google        |
   +---------------------+-------------------------------+ */
```

Exemple JS :
```javascript
// Toggle formulaire admin sur la page de connexion
// Depend de : auth/login.php (elements HTML : .admin-toggle, #adminForm)
// Utilise par : auth/login.php
//
// +---------------------+----------------------------------------------+
// | Element HTML        | Action                                       |
// +---------------------+----------------------------------------------+
// | .admin-toggle       | Clic → toggle classe .show sur #adminForm    |
// +---------------------+----------------------------------------------+
```
