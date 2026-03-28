<?php
// Documentation technique — page HTML riche avec sidebar
// Depend de : config.php (.credentials.php + .google_oauth.php), .credentials.php (lecture directe pour affichage)
// Utilise par : navigateur (acces direct admin uniquement)
//
// +--------------------+----------------------------------------------+
// | Section            | Contenu                                      |
// +--------------------+----------------------------------------------+
// | Architecture       | Arborescence fichiers + roles                |
// | Flux auth          | Google OAuth + Admin (diagrammes)            |
// | Base de donnees    | Table users (15 colonnes)                    |
// | Credentials        | .credentials.php + .google_oauth.php        |
// | Carte dependances  | Qui depend de qui (tableau)                  |
// +--------------------+----------------------------------------------+

require_once __DIR__ . '/../config.php';
$creds = require __DIR__ . '/../.credentials.php';

if (!isset($_SESSION['user']) || empty($_SESSION['user']['is_admin'])) {
    http_response_code(403);
    die('<h1 style="color:#e74c3c;font-family:sans-serif;text-align:center;margin-top:100px">Acces refuse — Admin uniquement</h1>');
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>bokonzifr — Documentation technique</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0d1117; color: #c9d1d9; font-family: 'Segoe UI', -apple-system, sans-serif; line-height: 1.7; }

        /* NAV LATERALE */
        .sidebar { position: fixed; top: 0; left: 0; width: 280px; height: 100vh; background: #161b22; border-right: 1px solid #30363d; overflow-y: auto; padding: 20px 0; z-index: 100; }
        .sidebar h2 { color: #6c5ce7; font-size: 16px; padding: 0 20px 15px; border-bottom: 1px solid #30363d; margin-bottom: 10px; }
        .sidebar a { display: block; padding: 6px 20px; color: #8b949e; text-decoration: none; font-size: 13px; border-left: 3px solid transparent; transition: all 0.2s; }
        .sidebar a:hover { color: #c9d1d9; background: #1c2128; }
        .sidebar a.active { color: #6c5ce7; border-left-color: #6c5ce7; background: #6c5ce710; }
        .sidebar a.sub { padding-left: 36px; font-size: 12px; }
        .sidebar .sep { height: 1px; background: #30363d; margin: 8px 20px; }

        /* CONTENU */
        .content { margin-left: 280px; max-width: 900px; padding: 40px 50px 80px; }
        h1 { color: #6c5ce7; font-size: 32px; margin-bottom: 8px; }
        h1 + p { color: #8b949e; margin-bottom: 35px; font-size: 15px; }
        h2 { color: #a78bfa; font-size: 22px; margin-top: 50px; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid #30363d; scroll-margin-top: 20px; }
        h3 { color: #d2b8fd; font-size: 16px; margin-top: 25px; margin-bottom: 10px; scroll-margin-top: 20px; }
        p { margin-bottom: 12px; }
        ul, ol { margin-left: 24px; margin-bottom: 12px; }
        li { margin-bottom: 4px; }
        strong { color: #e6edf3; }
        code { background: #1c2128; color: #f0883e; padding: 2px 7px; border-radius: 4px; font-size: 13px; font-family: 'Fira Code', 'Consolas', monospace; }
        a { color: #6c5ce7; text-decoration: none; }
        a:hover { text-decoration: underline; }

        /* TABLES */
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
        th { background: #161b22; color: #a78bfa; text-align: left; padding: 10px 12px; border: 1px solid #30363d; font-weight: 600; }
        td { padding: 8px 12px; border: 1px solid #21262d; }
        tr:hover td { background: #161b2280; }

        /* BLOCS CODE */
        pre { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px; overflow-x: auto; font-size: 13px; line-height: 1.5; }
        pre code { background: none; color: #c9d1d9; padding: 0; }
        .keyword { color: #ff7b72; }
        .string { color: #a5d6ff; }
        .comment { color: #8b949e; }
        .var { color: #ffa657; }
        .func { color: #d2a8ff; }

        /* DIAGRAMME FLUX */
        .flow { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 20px 24px; margin-bottom: 20px; font-family: 'Fira Code', monospace; font-size: 13px; line-height: 1.6; white-space: pre; overflow-x: auto; color: #8b949e; }
        .flow .node { color: #f0883e; }
        .flow .action { color: #a5d6ff; }
        .flow .arrow { color: #6c5ce7; }

        /* BADGES */
        .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
        .badge-php { background: #4f5d9520; color: #7b93db; }
        .badge-js { background: #f7df1e20; color: #f7df1e; }
        .badge-css { background: #1572b620; color: #5aafef; }
        .badge-sql { background: #e4843420; color: #e48434; }
        .badge-ok { background: #2ecc7120; color: #2ecc71; }

        /* CARDS */
        .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px; }
        .card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 14px 16px; }
        .card .label { color: #8b949e; font-size: 12px; margin-bottom: 4px; }
        .card .value { color: #e6edf3; font-size: 18px; font-weight: 600; }

        /* ARBRE FICHIERS */
        .tree { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px; font-family: 'Fira Code', monospace; font-size: 13px; line-height: 1.7; }
        .tree .dir { color: #6c5ce7; font-weight: 600; }
        .tree .file { color: #c9d1d9; }
        .tree .desc { color: #8b949e; }

        /* SCROLL TOP */
        .scroll-top { position: fixed; bottom: 25px; right: 25px; background: #6c5ce7; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 18px; opacity: 0; transition: opacity 0.3s; z-index: 100; border: none; }
        .scroll-top.show { opacity: 1; }

        /* RESPONSIVE */
        @media (max-width: 900px) {
            .sidebar { display: none; }
            .content { margin-left: 0; padding: 20px; }
        }
    </style>
</head>
<body>

<!-- ============ SIDEBAR ============ -->
<nav class="sidebar" id="sidebar">
    <h2>bokonzifr</h2>
    <a href="#stack">Stack technique</a>
    <a href="#archi">Architecture</a>
    <a href="#deps">Carte des dependances</a>
    <div class="sep"></div>
    <a href="#auth">Authentification</a>
    <a href="#auth-google" class="sub">Google OAuth 2.0</a>
    <a href="#auth-admin" class="sub">Login Admin</a>
    <a href="#auth-logout" class="sub">Deconnexion</a>
    <div class="sep"></div>
    <a href="#bdd">Base de donnees</a>
    <a href="#bdd-config" class="sub">Configuration</a>
    <a href="#bdd-auto" class="sub">Auto-creation</a>
    <a href="#bdd-users" class="sub">Table users</a>
    <div class="sep"></div>
    <a href="#oauth">Google OAuth 2.0</a>
    <a href="#oauth-creds" class="sub">Credentials</a>
    <a href="#oauth-data" class="sub">Donnees recuperees</a>
    <a href="#oauth-secu" class="sub">Securite</a>
    <div class="sep"></div>
    <a href="#admin">Login Admin</a>
    <a href="#session">Session PHP</a>
    <a href="#fonctions">Fonctions SQL</a>
    <a href="#pages">Pages et interface</a>
    <a href="#conventions">Conventions</a>
    <div class="sep"></div>
    <a href="#class">DatabaseHandler</a>
    <a href="#class-methods" class="sub">36 methodes</a>
    <a href="#class-raccourcis" class="sub">Raccourcis</a>
    <a href="#tests">Tests</a>
</nav>

<!-- ============ CONTENU ============ -->
<div class="content">

<!-- HEADER -->
<h1 id="top">bokonzifr</h1>
<p>Documentation technique complete du projet</p>

<div class="card-grid">
    <div class="card"><div class="label">Backend</div><div class="value">PHP 8+</div></div>
    <div class="card"><div class="label">Base de donnees</div><div class="value">MySQL</div></div>
    <div class="card"><div class="label">Serveur</div><div class="value">XAMPP</div></div>
    <div class="card"><div class="label">Auth</div><div class="value">OAuth 2.0</div></div>
</div>

<!-- ============ STACK ============ -->
<h2 id="stack">Stack technique</h2>
<table>
    <tr><th>Composant</th><th>Technologie</th></tr>
    <tr><td>Backend</td><td><span class="badge badge-php">PHP</span> PHP 8+ / MySQL (mysqli) / Apache</td></tr>
    <tr><td>Frontend</td><td><span class="badge badge-js">JS</span> <span class="badge badge-css">CSS</span> HTML/CSS/JS vanilla</td></tr>
    <tr><td>Serveur local</td><td>XAMPP (<code>C:\xampp\htdocs\dossier_bokonzi_fr</code>)</td></tr>
    <tr><td>Base de donnees</td><td><span class="badge badge-sql">SQL</span> <code>bokonzifr</code> (auto-creee au 1er chargement)</td></tr>
    <tr><td>Authentification</td><td>Google OAuth 2.0 + login admin (credentials BDD)</td></tr>
    <tr><td>Production</td><td>Hostinger (<code>bokonzi.fr</code>)</td></tr>
</table>

<!-- ============ ARCHITECTURE ============ -->
<h2 id="archi">Architecture des fichiers</h2>
<div class="tree">
<span class="dir">dossier_bokonzi_fr/</span>
├── <a href="#archi-index"><span class="file">index.php</span></a>             <span class="desc"># Aiguilleur (connecte → dashboard, deconnecte → login)</span>
├── <a href="#bdd-config"><span class="file">config.php</span></a>            <span class="desc"># Config globale (Google OAuth + BDD + auto-creation)</span>
├── <span class="dir">auth/</span>
│   ├── <a href="#auth-google"><span class="file">login.php</span></a>        <span class="desc"># Page de connexion (Google + Admin)</span>
│   ├── <a href="#auth-google"><span class="file">callback.php</span></a>     <span class="desc"># Retour Google OAuth → BDD + session</span>
│   └── <a href="#auth-logout"><span class="file">logout.php</span></a>       <span class="desc"># Deconnexion (destruction session)</span>
├── <span class="dir">pages/</span>
│   └── <a href="#pages-dash"><span class="file">dashboard.php</span></a>    <span class="desc"># Tableau de bord (page connectee)</span>
├── <span class="dir">css/</span>
│   ├── <span class="file">login.css</span>           <span class="desc"># Styles page de connexion</span>
│   └── <span class="file">dashboard.css</span>       <span class="desc"># Styles tableau de bord</span>
├── <span class="dir">js/</span>
│   └── <span class="file">login.js</span>            <span class="desc"># Toggle formulaire admin</span>
├── <span class="dir">sql/</span>
│   ├── <a href="#fn-init"><span class="file">config_sql.php</span></a>   <span class="desc"># initDatabase() — creation BDD + table users</span>
│   ├── <a href="#fn-admin"><span class="file">login_sql.php</span></a>    <span class="desc"># adminLogin() — requetes admin</span>
│   └── <a href="#fn-upsert"><span class="file">callback_sql.php</span></a> <span class="desc"># upsertGoogleUser() — requetes Google</span>
├── <span class="dir">admin/</span>
│   └── <span class="file">setup_bdd.php</span>       <span class="desc"># Creation manuelle BDD (optionnel)</span>
├── <span class="dir">Class/</span>
│   ├── <a href="#class"><span class="file">DatabaseHandler.php</span></a>  <span class="desc"># ORM leger (36 methodes)</span>
│   ├── <a href="#tests"><span class="file">DatabaseHandler_tests.php</span></a>      <span class="desc"># API JSON tests (79 tests)</span>
│   └── <a href="#tests"><span class="file">DatabaseHandler_tests_front.php</span></a> <span class="desc"># Interface HTML tests</span>
└── <span class="dir">docs/</span>
    ├── <span class="file">index.html</span>          <span class="desc"># Cette documentation</span>
    ├── <span class="file">FONCTIONNEMENT.md</span>   <span class="desc"># Version Markdown</span>
    ├── <span class="file">DatabaseHandler_exemples.php</span>   <span class="desc"># Exemples d'utilisation</span>
    └── <span class="file">DatabaseHandler_tests_doc.php</span>  <span class="desc"># Doc des 79 tests</span>
</div>

<!-- ============ DEPENDANCES ============ -->
<h2 id="deps">Carte des dependances</h2>
<table>
    <tr><th>Fichier</th><th>Depend de</th><th>Utilise par</th></tr>
    <tr>
        <td><code>index.php</code></td>
        <td><a href="#bdd-config"><code>config.php</code></a></td>
        <td>Point d'entree (acces direct)</td>
    </tr>
    <tr>
        <td><code>config.php</code></td>
        <td><a href="#fn-init"><code>sql/config_sql.php</code></a></td>
        <td><code>index.php</code>, <code>auth/login.php</code>, <code>auth/callback.php</code>, <code>auth/logout.php</code>, <code>pages/dashboard.php</code>, <code>admin/setup_bdd.php</code></td>
    </tr>
    <tr>
        <td><code>auth/login.php</code></td>
        <td><code>config.php</code>, <code>sql/login_sql.php</code>, <code>css/login.css</code>, <code>js/login.js</code></td>
        <td><code>index.php</code> (redirect), <code>auth/logout.php</code> (redirect)</td>
    </tr>
    <tr>
        <td><code>auth/callback.php</code></td>
        <td><code>config.php</code>, <a href="#fn-upsert"><code>sql/callback_sql.php</code></a></td>
        <td>Google (redirect apres auth)</td>
    </tr>
    <tr>
        <td><code>auth/logout.php</code></td>
        <td><code>config.php</code></td>
        <td><code>pages/dashboard.php</code> (bouton deconnecter)</td>
    </tr>
    <tr>
        <td><code>pages/dashboard.php</code></td>
        <td><code>config.php</code>, <code>css/dashboard.css</code></td>
        <td><code>index.php</code> (redirect si connecte)</td>
    </tr>
    <tr>
        <td><code>admin/setup_bdd.php</code></td>
        <td><code>config.php</code></td>
        <td>Acces direct (admin)</td>
    </tr>
    <tr>
        <td><code>css/login.css</code></td>
        <td>Rien (autonome)</td>
        <td><code>auth/login.php</code></td>
    </tr>
    <tr>
        <td><code>css/dashboard.css</code></td>
        <td>Rien (autonome)</td>
        <td><code>pages/dashboard.php</code></td>
    </tr>
    <tr>
        <td><code>js/login.js</code></td>
        <td><code>auth/login.php</code> (elements HTML)</td>
        <td><code>auth/login.php</code></td>
    </tr>
    <tr>
        <td><code>sql/config_sql.php</code></td>
        <td><code>config.php</code> (<code>$conn</code>, <code>DB_NAME</code>)</td>
        <td><code>config.php</code></td>
    </tr>
    <tr>
        <td><code>sql/login_sql.php</code></td>
        <td><code>config.php</code> (<code>$conn</code>)</td>
        <td><code>auth/login.php</code></td>
    </tr>
    <tr>
        <td><code>sql/callback_sql.php</code></td>
        <td><code>config.php</code> (<code>$conn</code>)</td>
        <td><code>auth/callback.php</code></td>
    </tr>
</table>

<!-- ============ AUTHENTIFICATION ============ -->
<h2 id="auth">Flux d'authentification</h2>

<h3 id="auth-google">Connexion Google OAuth 2.0</h3>
<div class="flow"><span class="node">Utilisateur</span>
    <span class="arrow">│</span>
    <span class="arrow">▼</span>
<span class="node">auth/login.php</span> ──── clic bouton Google ────► <span class="node">Google (accounts.google.com)</span>
                                                       <span class="arrow">│</span>
                                                       <span class="arrow">▼</span>
                                               <span class="action">Ecran consentement Google</span>
                                                       <span class="arrow">│</span>
                                                       <span class="arrow">▼</span> (code + state)
<span class="node">auth/callback.php</span> ◄─────────── redirect ───────────────┘
    <span class="arrow">│</span>
    <span class="arrow">├─</span> <span class="action">1. Verifie state CSRF (compare avec $_SESSION)</span>
    <span class="arrow">├─</span> <span class="action">2. Echange code → access_token (POST googleapis.com/token)</span>
    <span class="arrow">├─</span> <span class="action">3. Recupere infos user (GET googleapis.com/userinfo)</span>
    <span class="arrow">├─</span> <span class="action">4. INSERT ou UPDATE en BDD (sql/callback_sql.php)</span>
    <span class="arrow">├─</span> <span class="action">5. Incremente login_count</span>
    <span class="arrow">├─</span> <span class="action">6. Stocke tout en $_SESSION['user']</span>
    <span class="arrow">│</span>
    <span class="arrow">▼</span>
<span class="node">index.php</span> → redirect → <span class="node">pages/dashboard.php</span></div>

<h3 id="auth-admin">Connexion Admin</h3>
<div class="flow"><span class="node">Utilisateur</span>
    <span class="arrow">│</span>
    <span class="arrow">▼</span>
<span class="node">auth/login.php</span> ──── formulaire username/password
    <span class="arrow">│</span>
    <span class="arrow">├─</span> <span class="action">Compare avec DB_USER et DB_PASS (credentials BDD MySQL)</span>
    <span class="arrow">├─</span> <span class="action">Si OK : INSERT ou UPDATE admin en BDD (sql/login_sql.php)</span>
    <span class="arrow">├─</span> <span class="action">Incremente login_count</span>
    <span class="arrow">├─</span> <span class="action">$_SESSION['user']['is_admin'] = true</span>
    <span class="arrow">│</span>
    <span class="arrow">▼</span>
<span class="node">index.php</span> → redirect → <span class="node">pages/dashboard.php</span></div>

<h3 id="auth-logout">Deconnexion</h3>
<div class="flow"><span class="node">pages/dashboard.php</span> ──── clic "Se deconnecter"
    <span class="arrow">│</span>
    <span class="arrow">▼</span>
<span class="node">auth/logout.php</span>
    <span class="arrow">│</span>
    <span class="arrow">├─</span> <span class="action">session_destroy()</span>
    <span class="arrow">│</span>
    <span class="arrow">▼</span>
<span class="node">auth/login.php</span></div>

<!-- ============ BASE DE DONNEES ============ -->
<h2 id="bdd">Base de donnees</h2>

<h3 id="bdd-config">Configuration</h3>
<table>
    <tr><th>Parametre</th><th>Valeur (depuis .credentials.php)</th></tr>
    <tr><td>Host</td><td><code><?= htmlspecialchars($creds['DB_HOST']) ?></code></td></tr>
    <tr><td>Nom BDD</td><td><code><?= htmlspecialchars($creds['DB_NAME']) ?></code></td></tr>
    <tr><td>Utilisateur</td><td><code><?= htmlspecialchars($creds['DB_USER']) ?></code></td></tr>
    <tr><td>Mot de passe</td><td><code><?= $creds['DB_PASS'] === '' ? '(vide)' : htmlspecialchars($creds['DB_PASS']) ?></code></td></tr>
    <tr><td>Charset</td><td><code>utf8mb4</code></td></tr>
    <tr><td>Collation</td><td><code>utf8mb4_unicode_ci</code></td></tr>
</table>
<p>Tous les credentials sont stockes dans <code>.credentials.php</code> (jamais en dur dans le code).</p>

<h3 id="bdd-auto">Auto-creation</h3>
<p>La BDD et la table <code>users</code> sont creees automatiquement au premier chargement de n'importe quelle page via <code>config.php</code> → <a href="#fn-init"><code>sql/config_sql.php</code></a> → <code>initDatabase()</code>. Pas besoin d'executer <code>admin/setup_bdd.php</code> manuellement.</p>

<h3 id="bdd-users">Table <code>users</code></h3>
<table>
    <tr><th>Colonne</th><th>Type</th><th>Contrainte</th><th>Description</th></tr>
    <tr><td><code>id</code></td><td>INT</td><td>PK, AUTO_INCREMENT</td><td>ID interne</td></tr>
    <tr><td><code>google_id</code></td><td>VARCHAR(255)</td><td>UNIQUE, NOT NULL</td><td>ID Google (ou 'admin')</td></tr>
    <tr><td><code>email</code></td><td>VARCHAR(255)</td><td>UNIQUE, NOT NULL</td><td>Email Google (ou 'admin@local')</td></tr>
    <tr><td><code>email_verified</code></td><td>TINYINT(1)</td><td>DEFAULT 0</td><td>Email verifie par Google (0/1)</td></tr>
    <tr><td><code>name</code></td><td>VARCHAR(255)</td><td>DEFAULT ''</td><td>Nom complet</td></tr>
    <tr><td><code>given_name</code></td><td>VARCHAR(255)</td><td>DEFAULT ''</td><td>Prenom</td></tr>
    <tr><td><code>family_name</code></td><td>VARCHAR(255)</td><td>DEFAULT ''</td><td>Nom de famille</td></tr>
    <tr><td><code>picture</code></td><td>TEXT</td><td>DEFAULT NULL</td><td>URL photo de profil Google</td></tr>
    <tr><td><code>locale</code></td><td>VARCHAR(10)</td><td>DEFAULT ''</td><td>Langue (fr, en...)</td></tr>
    <tr><td><code>gender</code></td><td>VARCHAR(20)</td><td>DEFAULT ''</td><td>Genre</td></tr>
    <tr><td><code>hd</code></td><td>VARCHAR(255)</td><td>DEFAULT ''</td><td>Domaine Google Workspace</td></tr>
    <tr><td><code>login_count</code></td><td>INT</td><td>DEFAULT 0</td><td>Nombre total de connexions</td></tr>
    <tr><td><code>last_login</code></td><td>DATETIME</td><td>DEFAULT NULL</td><td>Date/heure derniere connexion</td></tr>
    <tr><td><code>created_at</code></td><td>DATETIME</td><td>DEFAULT CURRENT_TIMESTAMP</td><td>Date inscription</td></tr>
    <tr><td><code>updated_at</code></td><td>DATETIME</td><td>ON UPDATE CURRENT_TIMESTAMP</td><td>Derniere mise a jour</td></tr>
</table>

<!-- ============ GOOGLE OAUTH ============ -->
<h2 id="oauth">Google OAuth 2.0</h2>

<h3 id="oauth-creds">Credentials</h3>
<table>
    <tr><th>Parametre</th><th>Valeur</th></tr>
    <tr><td>Client ID</td><td><code><?= htmlspecialchars($creds['GOOGLE_CLIENT_ID']) ?></code></td></tr>
    <tr><td>Client Secret</td><td><code><?= htmlspecialchars($creds['GOOGLE_CLIENT_SECRET']) ?></code></td></tr>
    <tr><td>Redirect URI (local)</td><td><code>http://localhost/dossier_bokonzi_fr/auth/callback.php</code></td></tr>
    <tr><td>Redirect URI (prod)</td><td><code>https://bokonzi.fr/auth/callback.php</code></td></tr>
    <tr><td>Scopes</td><td><code>openid</code>, <code>email</code>, <code>profile</code></td></tr>
    <tr><td>Projet Google Cloud</td><td><code>bokonzifr</code></td></tr>
</table>

<h3 id="oauth-data">Donnees recuperees depuis Google</h3>
<table>
    <tr><th>Champ Google</th><th>Colonne BDD</th><th>Description</th></tr>
    <tr><td><code>id</code></td><td><code>google_id</code></td><td>ID Google unique</td></tr>
    <tr><td><code>email</code></td><td><code>email</code></td><td>Adresse email</td></tr>
    <tr><td><code>verified_email</code></td><td><code>email_verified</code></td><td>Email verifie (true/false → 1/0)</td></tr>
    <tr><td><code>name</code></td><td><code>name</code></td><td>Nom complet</td></tr>
    <tr><td><code>given_name</code></td><td><code>given_name</code></td><td>Prenom</td></tr>
    <tr><td><code>family_name</code></td><td><code>family_name</code></td><td>Nom de famille</td></tr>
    <tr><td><code>picture</code></td><td><code>picture</code></td><td>URL photo de profil</td></tr>
    <tr><td><code>locale</code></td><td><code>locale</code></td><td>Langue preferee</td></tr>
    <tr><td><code>gender</code></td><td><code>gender</code></td><td>Genre</td></tr>
    <tr><td><code>hd</code></td><td><code>hd</code></td><td>Domaine Google Workspace</td></tr>
</table>

<h3 id="oauth-secu">Securite OAuth</h3>
<ul>
    <li><strong>State CSRF</strong> : token aleatoire (<code>bin2hex(random_bytes(16))</code>) stocke en session, verifie au retour</li>
    <li><strong>Authorization Code Flow</strong> : tout cote serveur, pas de token client-side</li>
    <li><strong>Prompt</strong> : <code>consent</code> (redemande toujours le consentement)</li>
</ul>

<!-- ============ LOGIN ADMIN ============ -->
<h2 id="admin">Login Admin</h2>
<ul>
    <li>Le formulaire admin est cache par defaut, visible via le lien "Connexion administrateur"</li>
    <li>Les identifiants sont compares avec <code>DB_USER</code> et <code>DB_PASS</code> (credentials MySQL de <code>config.php</code>)</li>
    <li>Valeurs par defaut XAMPP : username = <code>root</code>, password = (vide)</li>
    <li>Les champs peuvent etre vides (pas de <code>required</code>)</li>
    <li>Message d'erreur rouge si identifiants incorrects</li>
    <li>L'admin est stocke en BDD comme un utilisateur normal (<code>google_id = 'admin'</code>, <code>email = 'admin@local'</code>)</li>
    <li><code>$_SESSION['user']['is_admin'] = true</code> pour differencier des utilisateurs Google</li>
</ul>

<h3>Compteur de connexions</h3>
<ul>
    <li>Chaque connexion (Google ou Admin) incremente <code>login_count</code> dans la table <a href="#bdd-users"><code>users</code></a></li>
    <li>La date/heure est enregistree dans <code>last_login</code></li>
    <li>Le compteur est affiche sur le <a href="#pages-dash">dashboard</a> avec un badge violet</li>
</ul>

<!-- ============ SESSION ============ -->
<h2 id="session">Session PHP</h2>

<h3>Donnees stockees dans <code>$_SESSION['user']</code></h3>
<table>
    <tr><th>Cle</th><th>Type</th><th>Description</th></tr>
    <tr><td><code>id</code></td><td>int</td><td>ID interne BDD</td></tr>
    <tr><td><code>google_id</code></td><td>string</td><td>ID Google ou 'admin'</td></tr>
    <tr><td><code>email</code></td><td>string</td><td>Email</td></tr>
    <tr><td><code>name</code></td><td>string</td><td>Nom complet</td></tr>
    <tr><td><code>given_name</code></td><td>string</td><td>Prenom</td></tr>
    <tr><td><code>family_name</code></td><td>string</td><td>Nom de famille</td></tr>
    <tr><td><code>picture</code></td><td>string</td><td>URL photo (vide pour admin)</td></tr>
    <tr><td><code>locale</code></td><td>string</td><td>Langue</td></tr>
    <tr><td><code>login_count</code></td><td>int</td><td>Nombre de connexions</td></tr>
    <tr><td><code>is_admin</code></td><td>bool</td><td>true seulement pour le login admin</td></tr>
</table>

<h3>Protection des pages</h3>
<table>
    <tr><th>Page</th><th>Condition</th><th>Action</th></tr>
    <tr><td><code>pages/dashboard.php</code></td><td><code>$_SESSION['user']</code> n'existe pas</td><td>Redirect → <code>auth/login.php</code></td></tr>
    <tr><td><code>auth/login.php</code></td><td><code>$_SESSION['user']</code> existe</td><td>Redirect → <code>index.php</code></td></tr>
    <tr><td><code>index.php</code></td><td>Automatique</td><td>Redirige selon l'etat de connexion</td></tr>
</table>

<!-- ============ FONCTIONS SQL ============ -->
<h2 id="fonctions">Fonctions SQL</h2>

<h3 id="fn-init"><code>initDatabase($conn)</code> — <code>sql/config_sql.php</code></h3>
<ul>
    <li>Cree la BDD <code>bokonzifr</code> si elle n'existe pas</li>
    <li>Cree la table <a href="#bdd-users"><code>users</code></a> si elle n'existe pas</li>
    <li>Appelee a chaque chargement de page via <code>config.php</code></li>
</ul>

<h3 id="fn-admin"><code>adminLogin($conn)</code> — <code>sql/login_sql.php</code></h3>
<ul>
    <li>Cherche l'admin en BDD (<code>WHERE email = 'admin@local'</code>)</li>
    <li>Si existe : incremente <code>login_count</code>, met a jour <code>last_login</code></li>
    <li>Si n'existe pas : cree l'entree admin (<code>google_id = 'admin'</code>)</li>
    <li>Retourne <code>['id' => int, 'login_count' => int]</code></li>
</ul>

<h3 id="fn-upsert"><code>upsertGoogleUser($conn, $userData)</code> — <code>sql/callback_sql.php</code></h3>
<ul>
    <li>Cherche l'utilisateur par <code>google_id</code></li>
    <li>Si existe : UPDATE toutes les infos + incremente <code>login_count</code></li>
    <li>Si n'existe pas : INSERT avec <code>login_count = 1</code></li>
    <li>Retourne <code>['id' => int, 'login_count' => int]</code></li>
</ul>

<!-- ============ PAGES ============ -->
<h2 id="pages">Pages et interface</h2>

<h3 id="archi-index">Page de connexion — <code>auth/login.php</code></h3>
<ul>
    <li>Theme sombre (<code>#0d1117</code>)</li>
    <li>Bouton "Se connecter avec Google" (blanc, icone Google)</li>
    <li>Separateur "ou"</li>
    <li>Lien "Connexion administrateur" → deplie le formulaire admin</li>
    <li>Formulaire admin : username + password + bouton violet</li>
    <li>Message d'erreur rouge si identifiants incorrects</li>
</ul>

<h3 id="pages-dash">Tableau de bord — <code>pages/dashboard.php</code></h3>
<ul>
    <li>Photo de profil Google (arrondie, 80x80)</li>
    <li>Nom + email</li>
    <li>Tableau d'informations : nom complet, prenom, nom de famille, email, langue, Google ID</li>
    <li>Badge violet avec le nombre de connexions</li>
    <li>Bouton rouge "Se deconnecter"</li>
</ul>

<!-- ============ CONVENTIONS ============ -->
<h2 id="conventions">Convention de commentaires</h2>
<p>Chaque fichier du projet contient un en-tete avec :</p>
<ol>
    <li><strong>Description</strong> : role du fichier en 1 ligne</li>
    <li><strong>Depend de</strong> : fichiers necessaires a son fonctionnement</li>
    <li><strong>Utilise par</strong> : fichiers qui l'appellent</li>
</ol>

<pre><code><span class="comment">// Page de connexion — Google OAuth + Admin</span>
<span class="comment">// Depend de : config.php, sql/login_sql.php, css/login.css, js/login.js</span>
<span class="comment">// Utilise par : index.php (redirect si deconnecte), auth/logout.php</span></code></pre>

<pre><code><span class="comment">/* Depend de : rien (fichier autonome)
   Utilise par : auth/login.php */</span></code></pre>

<pre><code><span class="comment">// Depend de : auth/login.php (elements HTML : .admin-toggle, #adminForm)
// Utilise par : auth/login.php</span></code></pre>

<!-- ============ DATABASEHANDLER ============ -->
<h2 id="class">DatabaseHandler</h2>
<p>ORM leger dans <code>Class/DatabaseHandler.php</code> — 36 methodes, ~900 lignes.</p>
<p>Connexion : <code>$creds = require '.credentials.php'; $db = new DatabaseHandler($creds['DB_NAME'], $creds['DB_USER'], $creds['DB_PASS'], $creds['DB_HOST']);</code></p>

<h3 id="class-methods">Toutes les methodes</h3>
<table>
    <tr><th>Categorie</th><th>Methode</th><th>Description</th></tr>
    <tr><td rowspan="2">Connexion</td><td><code>__construct($db, $user, $pass, $host)</code></td><td>Connexion a la BDD</td></tr>
    <tr><td><code>close()</code></td><td>Fermer la connexion</td></tr>
    <tr><td rowspan="5">Schema</td><td><code>getTables()</code></td><td>Liste des tables</td></tr>
    <tr><td><code>tableExists($table)</code></td><td>Verifie si une table existe</td></tr>
    <tr><td><code>getColumns($table)</code></td><td>Colonnes d'une table</td></tr>
    <tr><td><code>getSummary()</code></td><td>Resume complet de la BDD</td></tr>
    <tr><td><code>getConnection()</code></td><td>Retourne l'objet mysqli</td></tr>
    <tr><td rowspan="2">Create</td><td><code>createTable($table, $columns)</code></td><td>Creer une table</td></tr>
    <tr><td><code>addForeignKey($table, $col, $ref, $refCol)</code></td><td>Ajouter une FK</td></tr>
    <tr><td rowspan="9">Select</td><td><code>select($sql, $params)</code></td><td>Requete preparee</td></tr>
    <tr><td><code>selectAll($table)</code></td><td>Tout d'une table</td></tr>
    <tr><td><code>selectAllTables()</code></td><td>Tout de toutes les tables</td></tr>
    <tr><td><code>exists($sql, $params)</code></td><td>1ere ligne ou false</td></tr>
    <tr><td><code>count($table)</code></td><td>Compter les enregistrements</td></tr>
    <tr><td><code>first($table, $orderBy)</code></td><td>Premier enregistrement</td></tr>
    <tr><td><code>last($table, $orderBy)</code></td><td>Dernier enregistrement</td></tr>
    <tr><td><code>lastAuto($table)</code></td><td>Dernier (auto-detecte PK)</td></tr>
    <tr><td><code>join($t1, $t2, $k1, $k2, $cols, $type)</code></td><td>JOIN entre 2 tables</td></tr>
    <tr><td rowspan="2">Search</td><td><code>search($table, $col, $val, $limit)</code></td><td>LIKE sur 1 colonne</td></tr>
    <tr><td><code>searchMultiple($table, $cols, $val, $limit)</code></td><td>LIKE sur plusieurs colonnes</td></tr>
    <tr><td rowspan="5">Insert</td><td><code>insert($table, $data, $uniqueCol)</code></td><td>1 ligne</td></tr>
    <tr><td><code>insertBatch($table, $rows, $uniqueCol)</code></td><td>Plusieurs lignes, 1 table</td></tr>
    <tr><td><code>insertMulti($dataset, $uniqueKeys)</code></td><td>Plusieurs tables</td></tr>
    <tr><td><code>insertFromFile($table, $filePath)</code></td><td>Import depuis fichier PHP</td></tr>
    <tr><td><code>add($table, $data, $uniqueCol)</code></td><td><span class="badge badge-ok">raccourci</span> insert auto</td></tr>
    <tr><td rowspan="5">Update</td><td><code>update($table, $data, $where)</code></td><td>1 update</td></tr>
    <tr><td><code>updateBatch($table, $rows)</code></td><td>Plusieurs lignes, 1 table</td></tr>
    <tr><td><code>updateMulti($dataset)</code></td><td>Plusieurs tables</td></tr>
    <tr><td><code>edit($table, $col, $val, $data)</code></td><td><span class="badge badge-ok">raccourci</span> update simplifie</td></tr>
    <tr><td><code>find($table, $col, $val)</code></td><td><span class="badge badge-ok">raccourci</span> select simplifie</td></tr>
    <tr><td rowspan="7">Delete</td><td><code>delete($table, $where)</code></td><td>1 delete</td></tr>
    <tr><td><code>deleteById($table, $idCol, $idVal)</code></td><td>Delete par ID</td></tr>
    <tr><td><code>deleteBatch($table, $rows)</code></td><td>Plusieurs lignes, 1 table</td></tr>
    <tr><td><code>deleteMulti($dataset)</code></td><td>Plusieurs tables</td></tr>
    <tr><td><code>remove($table, $col, $val)</code></td><td><span class="badge badge-ok">raccourci</span> delete simplifie</td></tr>
    <tr><td><code>findWhere($table, $where)</code></td><td><span class="badge badge-ok">raccourci</span> select multi-conditions</td></tr>
    <tr><td><code>has($table, $col, $val)</code></td><td><span class="badge badge-ok">raccourci</span> existe ? true/false</td></tr>
    <tr><td>Raw</td><td><code>raw($sql)</code></td><td>Requete SQL brute</td></tr>
</table>

<h3 id="class-raccourcis">Raccourcis (operations simplifiees)</h3>
<table>
    <tr><th>Raccourci</th><th>Equivalent</th><th>Exemple</th></tr>
    <tr><td><code>add()</code></td><td><code>insert()</code> / <code>insertBatch()</code></td><td><code>$db->add('users', ['name'=>'Alice'])</code></td></tr>
    <tr><td><code>find()</code></td><td><code>select()</code></td><td><code>$db->find('users', 'id', 10)</code></td></tr>
    <tr><td><code>findWhere()</code></td><td><code>select()</code> multi-conditions</td><td><code>$db->findWhere('users', ['name'=>'A', 'locale'=>'fr'])</code></td></tr>
    <tr><td><code>has()</code></td><td><code>exists()</code></td><td><code>$db->has('users', 'email', 'a@t.com')</code></td></tr>
    <tr><td><code>edit()</code></td><td><code>update()</code></td><td><code>$db->edit('users', 'id', 10, ['name'=>'New'])</code></td></tr>
    <tr><td><code>remove()</code></td><td><code>delete()</code></td><td><code>$db->remove('users', 'id', 10)</code></td></tr>
</table>

<!-- ============ TESTS ============ -->
<h2 id="tests">Tests</h2>
<div class="card-grid">
    <div class="card"><div class="label">Total tests</div><div class="value">79</div></div>
    <div class="card"><div class="label">Sections</div><div class="value">11</div></div>
    <div class="card"><div class="label">Methodes couvertes</div><div class="value">36/36</div></div>
    <div class="card"><div class="label">Format</div><div class="value">API JSON</div></div>
</div>

<table>
    <tr><th>Section</th><th>Tests</th><th>Methodes testees</th></tr>
    <tr><td>Connexion</td><td>2</td><td><code>__construct</code>, <code>getConnection</code></td></tr>
    <tr><td>Create</td><td>13</td><td><code>createTable</code>, <code>tableExists</code>, <code>getColumns</code>, <code>addForeignKey</code></td></tr>
    <tr><td>Insert</td><td>9</td><td><code>insert</code>, <code>insertBatch</code>, <code>insertMulti</code>, <code>add</code>, <code>insertFromFile</code></td></tr>
    <tr><td>Select</td><td>20</td><td><code>count</code>, <code>selectAll</code>, <code>selectAllTables</code>, <code>select</code>, <code>find</code>, <code>findWhere</code>, <code>has</code>, <code>exists</code>, <code>first</code>, <code>last</code>, <code>lastAuto</code></td></tr>
    <tr><td>Search</td><td>4</td><td><code>search</code>, <code>searchMultiple</code></td></tr>
    <tr><td>Join</td><td>3</td><td><code>join</code> (INNER, LEFT, colonnes)</td></tr>
    <tr><td>Update</td><td>9</td><td><code>update</code>, <code>updateBatch</code>, <code>updateMulti</code>, <code>edit</code></td></tr>
    <tr><td>Delete</td><td>9</td><td><code>delete</code>, <code>deleteBatch</code>, <code>deleteMulti</code>, <code>deleteById</code>, <code>remove</code></td></tr>
    <tr><td>Schema</td><td>5</td><td><code>getTables</code>, <code>getSummary</code></td></tr>
    <tr><td>Raw</td><td>3</td><td><code>raw</code></td></tr>
    <tr><td>Nettoyage</td><td>2</td><td>Suppression tables de test</td></tr>
</table>

<p style="margin-top: 15px;">
    <strong>Lancer les tests :</strong><br>
    API JSON : <code><a href="../Class/DatabaseHandler_tests.php">Class/DatabaseHandler_tests.php</a></code><br>
    Interface : <code><a href="../Class/DatabaseHandler_tests_front.php">Class/DatabaseHandler_tests_front.php</a></code>
</p>

</div>

<!-- SCROLL TOP -->
<button class="scroll-top" id="scrollTop" onclick="window.scrollTo({top:0,behavior:'smooth'})">&#9650;</button>

<script>
// Scroll top button
window.addEventListener('scroll', function() {
    document.getElementById('scrollTop').classList.toggle('show', window.scrollY > 300);
});

// Active sidebar link
var links = document.querySelectorAll('.sidebar a[href^="#"]');
var sections = [];
links.forEach(function(link) {
    var id = link.getAttribute('href').substring(1);
    var el = document.getElementById(id);
    if (el) sections.push({ link: link, el: el });
});

window.addEventListener('scroll', function() {
    var scrollPos = window.scrollY + 100;
    var active = null;
    for (var i = sections.length - 1; i >= 0; i--) {
        if (sections[i].el.offsetTop <= scrollPos) {
            active = sections[i].link;
            break;
        }
    }
    links.forEach(function(l) { l.classList.remove('active'); });
    if (active) active.classList.add('active');
});
</script>

</body>
</html>
