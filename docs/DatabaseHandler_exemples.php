<?php
// Exemples d'utilisation de DatabaseHandler — reference developpeur
// Depend de : Class/DatabaseHandler.php, .credentials.php (identifiants BDD)
// Utilise par : documentation / reference uniquement (ne pas inclure en production)
//
// +--------------------+----------------------------------------------+
// | Section            | Exemples couverts                            |
// +--------------------+----------------------------------------------+
// | Connexion          | new DatabaseHandler(host, user, pass, db)    |
// | CRUD               | insert, select, update, delete               |
// | Raccourcis         | add, find, findWhere, has, edit, remove      |
// | Jointures          | selectJoin (INNER, LEFT)                     |
// | Recherche          | search, searchMultiple                       |
// | Schema             | createTable, addColumn, describe             |
// | Transactions       | beginTransaction, commit, rollback           |
// +--------------------+----------------------------------------------+

require_once 'DatabaseHandler.php';

// ========================================
// CONNEXION
// ========================================

$creds = require __DIR__ . '/../.credentials.php';
$db = new DatabaseHandler($creds['DB_NAME'], $creds['DB_USER'], $creds['DB_PASS'], $creds['DB_HOST']);

// ========================================
// SCHEMA — Tables et colonnes
// ========================================

// Lister les tables
$tables = $db->getTables();
// ['users', 'projets', ...]

// Verifier si une table existe
$exists = $db->tableExists('users');
// true ou false

// Colonnes d'une table
$columns = $db->getColumns('users');
// ['id', 'google_id', 'email', 'name', ...]

// Resume complet de la BDD
$summary = $db->getSummary();
// ['users' => ['nom' => 'users', 'colonnes' => [...], 'nombre_colonnes' => 15, 'nombre_enregistrements' => 42]]

// ========================================
// CREATE — Tables et FK
// ========================================

// Creer une table
$db->createTable('projets', [
    'id_projet' => 'INT AUTO_INCREMENT PRIMARY KEY',
    'id_utilisateur' => 'INT',
    'nom_projet' => 'VARCHAR(100)',
    'description' => 'TEXT',
    'created_at' => 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
]);

// Ajouter une cle etrangere
$db->addForeignKey(
    'projets',          // table source
    'id_utilisateur',   // colonne FK
    'users',            // table reference
    'id',               // colonne reference
    'CASCADE',          // ON DELETE
    'CASCADE'           // ON UPDATE
);

// ========================================
// SELECT — Lecture
// ========================================

// Requete personnalisee avec parametres
$result = $db->select("SELECT * FROM users WHERE email = ?", ['alice@test.com']);
if ($result['success']) {
    print_r($result['data']);
}

// Tout recuperer d'une table
$users = $db->selectAll('users');

// Tout recuperer de toutes les tables
$allData = $db->selectAllTables();
// ['users' => [...], 'projets' => [...]]

// Verifier si un enregistrement existe
$user = $db->exists("SELECT * FROM users WHERE google_id = ?", ['123456']);
if ($user) {
    echo "Trouve : " . $user['name'];
}

// Compter les enregistrements
$total = $db->count('users');
// 42

// Premier / dernier enregistrement
$first = $db->first('users', 'id');
$last = $db->last('users', 'id');

// Dernier enregistrement (auto-detecte PK ou colonne date)
$lastAuto = $db->lastAuto('users');

// ========================================
// SEARCH — Recherche LIKE
// ========================================

// Recherche sur une colonne
$results = $db->search('users', 'name', 'Alice', 10);

// Recherche sur plusieurs colonnes
$results = $db->searchMultiple('users', ['name', 'email'], 'alice', 5);

// ========================================
// JOIN — Jointures
// ========================================

// Join simple (meme cle)
$result = $db->join('users', 'projets', 'id', 'id_utilisateur');
print_r($result['data']);

// Join avec colonnes specifiques
$result = $db->join(
    'users', 'projets',
    'id', 'id_utilisateur',
    ['t1.name AS nom_utilisateur', 't1.email', 't2.nom_projet', 't2.description']
);

// LEFT JOIN
$result = $db->join('users', 'projets', 'id', 'id_utilisateur', [], 'LEFT');

// ========================================
// INSERT — Ajout
// ========================================

// ---- INSERT MULTI-TABLES (haut niveau) ----
// 1 seul appel pour inserer dans plusieurs tables a la fois
$dataset = [
    'users' => [
        ['google_id' => 'g001', 'email' => 'alice@test.com', 'name' => 'Alice'],
        ['google_id' => 'g002', 'email' => 'bob@test.com', 'name' => 'Bob'],
        ['google_id' => 'g003', 'email' => 'charlie@test.com', 'name' => 'Charlie'],
    ],
    'projets' => [
        ['nom_projet' => 'Projet Alpha', 'id_utilisateur' => 1, 'description' => 'Premier projet'],
        ['nom_projet' => 'Projet Beta', 'id_utilisateur' => 2, 'description' => 'Deuxieme projet'],
    ],
    'categories' => [
        ['nom' => 'Sport'],
        ['nom' => 'Musique'],
    ]
];

// Sans verification de doublons
$result = $db->insertMulti($dataset);
echo "Total insere : " . $result['total_inserted'] . "\n";
foreach ($result['details'] as $table => $info) {
    echo "  $table : {$info['inserted']} inseres, {$info['skipped']} ignores\n";
    foreach ($info['errors'] as $err) {
        echo "    Erreur : $err\n";
    }
}

// Avec verification de doublons par table
$result = $db->insertMulti($dataset, [
    'users' => 'email',           // verifie email unique
    'projets' => 'nom_projet',    // verifie nom_projet unique
]);

// Insert 1 seule ligne dans 1 table (auto-detecte)
$result = $db->insertMulti([
    'users' => ['google_id' => 'g004', 'email' => 'diana@test.com', 'name' => 'Diana']
]);

// ---- INSERT BATCH (plusieurs lignes, 1 table) ----
$result = $db->insertBatch('users', [
    ['google_id' => 'g005', 'email' => 'eve@test.com', 'name' => 'Eve'],
    ['google_id' => 'g006', 'email' => 'frank@test.com', 'name' => 'Frank'],
], 'email'); // avec verification doublon sur email
echo "Inseres : {$result['inserted']}, Ignores : {$result['skipped']}\n";

// ---- INSERT SIMPLE (1 ligne, 1 table) ----

// Insert simple
$result = $db->insert('users', [
    'google_id' => '789',
    'email' => 'bob@test.com',
    'name' => 'Bob'
]);
if ($result['success']) {
    echo "ID insere : " . $result['id'];
}

// Insert avec verification doublon
$result = $db->insert('users', [
    'google_id' => '789',
    'email' => 'bob@test.com',
    'name' => 'Bob'
], 'email'); // verifie que l'email n'existe pas deja

// Import batch depuis un fichier PHP (le fichier doit contenir $data = [...])
$result = $db->insertFromFile('users', 'data/users_import.php');
echo "Inseres : " . $result['inserted'];

// ========================================
// UPDATE — Mise a jour
// ========================================

// ---- UPDATE MULTI-TABLES (haut niveau) ----
// 1 seul appel pour mettre a jour dans plusieurs tables a la fois
$dataset = [
    'users' => [
        ['where' => ['id' => 1], 'data' => ['name' => 'Alice Modifiee', 'locale' => 'fr']],
        ['where' => ['id' => 2], 'data' => ['name' => 'Bob Modifie', 'locale' => 'en']],
    ],
    'projets' => [
        ['where' => ['id_projet' => 1], 'data' => ['description' => 'Projet mis a jour']],
    ]
];

$result = $db->updateMulti($dataset);
echo "Total modifie : " . $result['total_affected'] . "\n";
foreach ($result['details'] as $table => $info) {
    echo "  $table : {$info['affected']} modifies\n";
    foreach ($info['errors'] as $err) {
        echo "    Erreur : $err\n";
    }
}

// ---- UPDATE BATCH (plusieurs lignes, 1 table) ----
$result = $db->updateBatch('users', [
    ['where' => ['id' => 1], 'data' => ['login_count' => 0]],
    ['where' => ['id' => 2], 'data' => ['login_count' => 0, 'locale' => 'en']],
]);
echo "Modifies : {$result['affected']}\n";

// ---- UPDATE SIMPLE (1 ligne, 1 table) ----

// Update avec conditions
$result = $db->update('users',
    ['name' => 'Bob Modifie', 'locale' => 'en'],  // donnees
    ['id' => 5]                                     // WHERE
);
echo "Lignes modifiees : " . $result['affected_rows'];

// Update avec plusieurs conditions WHERE
$result = $db->update('users',
    ['login_count' => 0],
    ['email' => 'bob@test.com', 'google_id' => '789']
);

// ========================================
// DELETE — Suppression
// ========================================

// ---- DELETE MULTI-TABLES (haut niveau) ----
// 1 seul appel pour supprimer dans plusieurs tables a la fois
$dataset = [
    'users' => [
        ['email' => 'alice@test.com'],
        ['email' => 'bob@test.com'],
    ],
    'projets' => [
        ['id_projet' => 1],
        ['id_projet' => 2, 'id_utilisateur' => 3],
    ],
    'categories' => [
        ['nom' => 'Sport'],
    ]
];

$result = $db->deleteMulti($dataset);
echo "Total supprime : " . $result['total_affected'] . "\n";
foreach ($result['details'] as $table => $info) {
    echo "  $table : {$info['affected']} supprimes\n";
    foreach ($info['errors'] as $err) {
        echo "    Erreur : $err\n";
    }
}

// ---- DELETE BATCH (plusieurs lignes, 1 table) ----
$result = $db->deleteBatch('users', [
    ['email' => 'eve@test.com'],
    ['email' => 'frank@test.com'],
]);
echo "Supprimes : {$result['affected']}\n";

// ---- DELETE SIMPLE (1 ligne, 1 table) ----

// Delete avec conditions
$result = $db->delete('users', ['email' => 'bob@test.com']);
echo "Lignes supprimees : " . $result['affected_rows'];

// Delete par ID (raccourci)
$db->deleteById('users', 'id', 5);

// ========================================
// RACCOURCIS — Operations simplifiees (add/find/has/edit/remove)
// ========================================

// ---- ADD (insert simplifie) ----
$db->add('users', ['name' => 'Alice', 'email' => 'alice@test.com']);                  // 1 ligne
$db->add('users', [['name' => 'Bob'], ['name' => 'Charlie']]);                        // plusieurs lignes
$db->add('users', [['name' => 'Diana'], ['name' => 'Eve']], 'email');                 // avec doublon

// ---- FIND (select simplifie) ----
$tous = $db->find('users');                          // toutes les lignes
$user = $db->find('users', 'id', 10);               // 1 ligne par colonne + valeur
$user = $db->find('users', 'email', 'alice@test.com');
$user = $db->findWhere('users', ['name' => 'Alice', 'locale' => 'fr']);  // plusieurs conditions

// ---- HAS (existe ?) ----
if ($db->has('users', 'email', 'alice@test.com')) {
    echo "Existe !";
}

// ---- EDIT (update simplifie) ----
$db->edit('users', 'id', 10, ['name' => 'Nouveau nom']);                // colonne + valeur + nouvelles donnees
$db->edit('users', 'email', 'a@t.com', ['locale' => 'en', 'name' => 'Alice EN']);

// ---- REMOVE (delete simplifie) ----
$db->remove('users', 'id', 10);                     // colonne + valeur
$db->remove('users', 'email', 'alice@test.com');

// ========================================
// RAW — Requete SQL brute
// ========================================

// SELECT brut
$result = $db->raw("SELECT COUNT(*) AS total FROM users WHERE login_count > 5");
print_r($result['data']);

// INSERT/UPDATE/DELETE brut
$result = $db->raw("UPDATE users SET login_count = 0 WHERE id = 1");
echo "Lignes affectees : " . $result['affected_rows'];

// ========================================
// FERMETURE
// ========================================

$db->close();
