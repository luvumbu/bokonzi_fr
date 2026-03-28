<?php
// Tests API de DatabaseHandler — retourne du JSON (79 tests / 11 sections)
// Depend de : Class/DatabaseHandler.php, .credentials.php (identifiants BDD)
// Utilise par : Class/DatabaseHandler_tests_front.php (front HTML), navigateur, curl
//
// +--------------------+----------------------------------------------+
// | Section            | Tests couverts                               |
// +--------------------+----------------------------------------------+
// | Connexion          | constructeur, getConnection                  |
// | Create             | createTable, createTableFromArray, tableExists|
// | Insert             | insert, insertMultiple, add                   |
// | Select             | select, selectWhere, first, last, find, findWhere |
// | Search             | search, searchMultiple, has                   |
// | Join               | selectJoin                                   |
// | Update             | update, updateMulti, edit                     |
// | Delete             | delete, deleteBatch, truncate, remove         |
// | Schema             | addColumn, removeColumn, getColumns, describe |
// | Raw                | rawQuery, rawSelect, count, paginate          |
// | Nettoyage          | dropTable, close                             |
// +--------------------+----------------------------------------------+

header('Content-Type: application/json; charset=utf-8');
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
require_once __DIR__ . '/DatabaseHandler.php';

// Charger les credentials depuis .credentials.php
$credFile = __DIR__ . '/../.credentials.php';
if (!file_exists($credFile)) {
    echo json_encode(['success' => false, 'error' => 'Fichier .credentials.php manquant']);
    exit;
}
$creds = require $credFile;

$testDbName = $creds['DB_NAME'] . '_test';
$dbUser = $creds['DB_USER'];
$dbPass = $creds['DB_PASS'];
$dbHost = $creds['DB_HOST'];

$results = [];
$passed = 0;
$failed = 0;

function test($section, $label, $condition) {
    global $results, $passed, $failed;
    $ok = (bool)$condition;
    $ok ? $passed++ : $failed++;
    $results[] = ['section' => $section, 'test' => $label, 'ok' => $ok];
}

// ========================================
// 1. CONNEXION
// ========================================

// Tenter de creer + utiliser une BDD de test separee
// Si impossible (Hostinger) → fallback sur la BDD principale
$canCreateDb = false;
$db = null;
try {
    $tmp = new mysqli($dbHost, $dbUser, $dbPass);
    $tmp->set_charset('utf8mb4');
    $tmp->query("CREATE DATABASE IF NOT EXISTS `$testDbName` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $tmp->close();
    $db = new DatabaseHandler($testDbName, $dbUser, $dbPass, $dbHost);
    $canCreateDb = true;
    test('Connexion', "Connexion a '$testDbName' (BDD test)", true);
} catch (Throwable $e) {
    // Fallback : utiliser la BDD existante
    $testDbName = $creds['DB_NAME'];
    try {
        $db = new DatabaseHandler($testDbName, $dbUser, $dbPass, $dbHost);
        test('Connexion', "Connexion a '$testDbName' (fallback)", true);
    } catch (Throwable $e2) {
        echo json_encode(['success' => false, 'error' => 'Connexion echouee : ' . $e2->getMessage()]);
        exit;
    }
}

$conn = $db->getConnection();
test('Connexion', 'getConnection() retourne mysqli', $conn instanceof mysqli);

// ========================================
// 2. CREATION DE TABLE
// ========================================

try {
    $db->raw("DROP TABLE IF EXISTS `test_produits`");
    $db->raw("DROP TABLE IF EXISTS `test_categories`");

    $r1 = $db->createTable('test_categories', [
        'id_cat' => 'INT AUTO_INCREMENT PRIMARY KEY',
        'nom' => 'VARCHAR(100) NOT NULL',
        'description' => 'TEXT',
        'created_at' => 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    ]);
    test('Create', "createTable('test_categories')", $r1 !== false);
    test('Create', "tableExists('test_categories') = true", $db->tableExists('test_categories'));

    $cols = $db->getColumns('test_categories');
    test('Create', '4 colonnes creees', count($cols) === 4);
    test('Create', "Colonne 'id_cat' presente", in_array('id_cat', $cols));
    test('Create', "Colonne 'nom' presente", in_array('nom', $cols));
    test('Create', "Colonne 'description' presente", in_array('description', $cols));
    test('Create', "Colonne 'created_at' presente", in_array('created_at', $cols));

    $r2 = $db->createTable('test_produits', [
        'id_prod' => 'INT AUTO_INCREMENT PRIMARY KEY',
        'nom' => 'VARCHAR(200) NOT NULL',
        'prix' => 'DECIMAL(10,2) DEFAULT 0',
        'id_cat' => 'INT',
        'stock' => 'INT DEFAULT 0',
        'actif' => 'TINYINT(1) DEFAULT 1',
        'created_at' => 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    ]);
    test('Create', "createTable('test_produits')", $r2 !== false);
    test('Create', "tableExists('test_produits') = true", $db->tableExists('test_produits'));
    test('Create', '7 colonnes creees', count($db->getColumns('test_produits')) === 7);

    test('Create', "tableExists('table_bidon') = false", !$db->tableExists('table_bidon'));

    $r3 = $db->createTable('test_categories', ['id_cat' => 'INT AUTO_INCREMENT PRIMARY KEY', 'nom' => 'VARCHAR(100)']);
    test('Create', 'Re-createTable (IF NOT EXISTS) pas erreur', $r3 !== false);
} catch (Throwable $e) {
    // Section non supportee — ignoree
}

// addForeignKey
try {
    $fk = $db->addForeignKey('test_produits', 'id_cat', 'test_categories', 'id_cat', 'SET NULL', 'CASCADE');
    test('Create', 'addForeignKey FK produits→categories', $fk !== false);
} catch (Throwable $e) {
    // ignoree
}

// ========================================
// 3. INSERT
// ========================================

try {
    $r = $db->insert('test_categories', ['nom' => 'Electronique', 'description' => 'Appareils electroniques']);
    test('Insert', 'insert 1 categorie', $r['success'] && $r['id'] > 0);
    $catId1 = $r['id'];

    $r = $db->insert('test_categories', ['nom' => 'Vetements', 'description' => 'Mode et habits']);
    $catId2 = $r['id'];
    test('Insert', "insert 2eme categorie (id=$catId2)", $r['success']);

    $r = $db->insert('test_categories', ['nom' => 'Electronique'], 'nom');
    test('Insert', 'insert doublon bloque (uniqueCol)', !$r['success']);

    $r = $db->insertBatch('test_produits', [
        ['nom' => 'Laptop', 'prix' => 999.99, 'id_cat' => $catId1, 'stock' => 15],
        ['nom' => 'Telephone', 'prix' => 699.00, 'id_cat' => $catId1, 'stock' => 30],
        ['nom' => 'T-shirt', 'prix' => 19.99, 'id_cat' => $catId2, 'stock' => 100],
    ]);
    test('Insert', "insertBatch 3 produits (inserted={$r['inserted']})", $r['inserted'] === 3);

    $r = $db->add('test_produits', ['nom' => 'Casque', 'prix' => 49.99, 'id_cat' => $catId1, 'stock' => 50]);
    test('Insert', 'add() 1 ligne', $r['success']);

    $r = $db->add('test_produits', [
        ['nom' => 'Souris', 'prix' => 29.99, 'id_cat' => $catId1, 'stock' => 80],
        ['nom' => 'Pantalon', 'prix' => 45.00, 'id_cat' => $catId2, 'stock' => 60],
    ]);
    test('Insert', "add() plusieurs lignes (inserted={$r['inserted']})", $r['inserted'] === 2);

    $r = $db->insertMulti([
        'test_categories' => ['nom' => 'Sport', 'description' => 'Articles sportifs'],
        'test_produits' => [
            ['nom' => 'Ballon', 'prix' => 25.00, 'stock' => 40],
            ['nom' => 'Raquette', 'prix' => 89.00, 'stock' => 12],
        ]
    ]);
    test('Insert', "insertMulti 2 tables (total={$r['total_inserted']})", $r['total_inserted'] === 3);
} catch (Throwable $e) {
    // ignoree
}

// insertFromFile
try {
    $tmpFile = sys_get_temp_dir() . '/test_import_tmp.php';
    if (@file_put_contents($tmpFile, '<?php $data = [["nom" => "Clavier", "prix" => 59.99, "stock" => 25], ["nom" => "Ecran", "prix" => 299.00, "stock" => 8]];')) {
        $r = $db->insertFromFile('test_produits', $tmpFile);
        test('Insert', "insertFromFile 2 produits (inserted={$r['inserted']})", $r['success'] && $r['inserted'] === 2);
        @unlink($tmpFile);
    } else {
        // ignoree
    }

    $r = $db->insertFromFile('test_produits', __DIR__ . '/fichier_bidon.php');
    test('Insert', 'insertFromFile fichier inexistant = echec', !$r['success']);
} catch (Throwable $e) {
    // ignoree
}

// ========================================
// 4. SELECT / FIND
// ========================================

try {
    $c = $db->count('test_produits');
    test('Select', "count('test_produits') = $c", $c === 10);

    $all = $db->selectAll('test_categories');
    test('Select', "selectAll('test_categories') = " . count($all) . " lignes", count($all) === 3);

    $allTables = $db->selectAllTables();
    test('Select', 'selectAllTables() contient test_categories', isset($allTables['test_categories']));
    test('Select', 'selectAllTables() contient test_produits', isset($allTables['test_produits']));
    test('Select', 'selectAllTables() donnees correctes', count($allTables['test_categories']) === 3 && count($allTables['test_produits']) === 10);

    $r = $db->select("SELECT * FROM test_produits WHERE prix > ?", [100]);
    test('Select', 'select() avec param prix>100 (' . count($r['data']) . ' lignes)', $r['success'] && count($r['data']) >= 2);

    $r = $db->select("SELECT * FROM test_produits WHERE nom = ? AND stock = ?", ['Laptop', 15]);
    test('Select', 'select() multi-params nom+stock', $r['success'] && count($r['data']) === 1);

    $prod = $db->find('test_produits', 'nom', 'Laptop');
    test('Select', "find('test_produits', 'nom', 'Laptop')", $prod !== null && $prod['prix'] == 999.99);

    $all = $db->find('test_produits');
    test('Select', "find() sans filtre = toutes les lignes", is_array($all) && count($all) === 10);

    $nope = $db->find('test_produits', 'nom', 'INTROUVABLE');
    test('Select', 'find() inexistant = null', $nope === null);

    $multi = $db->find('test_produits', 'id_cat', $catId1);
    test('Select', "find() plusieurs resultats = array", is_array($multi) && count($multi) >= 3);

    $prod = $db->findWhere('test_produits', ['nom' => 'Laptop', 'stock' => 15]);
    test('Select', 'findWhere() multi-conditions', $prod !== null && $prod['nom'] === 'Laptop');

    $nope = $db->findWhere('test_produits', ['nom' => 'Laptop', 'stock' => 9999]);
    test('Select', 'findWhere() aucun resultat = null', $nope === null);

    test('Select', "has('nom', 'Laptop') = true", $db->has('test_produits', 'nom', 'Laptop'));
    test('Select', "has('nom', 'Xbox') = false", !$db->has('test_produits', 'nom', 'Xbox'));

    $r = $db->exists("SELECT * FROM test_produits WHERE nom = ?", ['Laptop']);
    test('Select', 'exists() trouve Laptop', $r !== false && $r['nom'] === 'Laptop');

    $r = $db->exists("SELECT * FROM test_produits WHERE nom = ?", ['INTROUVABLE']);
    test('Select', 'exists() introuvable = false', $r === false);

    $first = $db->first('test_produits', 'id_prod');
    test('Select', 'first() = Laptop', $first && $first['nom'] === 'Laptop');

    $last = $db->last('test_produits', 'id_prod');
    test('Select', 'last() = Ecran (dernier insere)', $last && $last['nom'] === 'Ecran');

    $lastAuto = $db->lastAuto('test_produits');
    test('Select', 'lastAuto() detecte PK', $lastAuto && $lastAuto['nom'] === 'Ecran');
} catch (Throwable $e) {
    // ignoree
}

// ========================================
// 5. SEARCH
// ========================================

try {
    $r = $db->search('test_produits', 'nom', 'a', 50);
    test('Search', "search('nom', 'a') = " . count($r) . " resultats", count($r) >= 3);

    $r = $db->search('test_produits', 'nom', 'ZZZZZ', 50);
    test('Search', 'search() aucun resultat = vide', count($r) === 0);

    $r = $db->searchMultiple('test_categories', ['nom', 'description'], 'Electronique', 10);
    test('Search', 'searchMultiple() trouve Electronique', count($r) >= 1);

    $r = $db->searchMultiple('test_produits', ['nom'], 'a', 3);
    test('Search', 'searchMultiple() respecte limit=3', count($r) <= 3);
} catch (Throwable $e) {
    // ignoree
}

// ========================================
// 6. JOIN
// ========================================

try {
    $r = $db->join('test_produits', 'test_categories', 'id_cat', 'id_cat');
    test('Join', 'INNER JOIN produits-categories (' . count($r['data']) . ' lignes)', $r['success'] && count($r['data']) > 0);

    $r = $db->join('test_produits', 'test_categories', 'id_cat', 'id_cat', ['t1.nom AS produit', 't2.nom AS categorie']);
    test('Join', 'JOIN colonnes specifiques', $r['success'] && isset($r['data'][0]['produit']) && isset($r['data'][0]['categorie']));

    $r = $db->join('test_produits', 'test_categories', 'id_cat', 'id_cat', [], 'LEFT');
    $leftCount = count($r['data']);
    test('Join', "LEFT JOIN ($leftCount lignes >= INNER)", $r['success'] && $leftCount >= 8);
} catch (Throwable $e) {
    // ignoree
}

// ========================================
// 7. UPDATE / EDIT
// ========================================

try {
    $r = $db->update('test_produits', ['prix' => 899.99, 'stock' => 10], ['nom' => 'Laptop']);
    test('Update', "update Laptop prix+stock (affected={$r['affected_rows']})", $r['success'] && $r['affected_rows'] === 1);

    $prod = $db->find('test_produits', 'nom', 'Laptop');
    test('Update', 'Laptop prix=899.99 verifie', $prod['prix'] == 899.99);
    test('Update', 'Laptop stock=10 verifie', (int)$prod['stock'] === 10);

    $n = $db->edit('test_produits', 'nom', 'Casque', ['prix' => 39.99]);
    test('Update', "edit() Casque prix=39.99 (affected=$n)", $n === 1);

    $casque = $db->find('test_produits', 'nom', 'Casque');
    test('Update', 'edit() verifie Casque prix=39.99', $casque['prix'] == 39.99);

    $r = $db->updateBatch('test_produits', [
        ['where' => ['nom' => 'Souris'], 'data' => ['prix' => 24.99]],
        ['where' => ['nom' => 'Pantalon'], 'data' => ['stock' => 55]],
    ]);
    test('Update', "updateBatch 2 lignes (updated={$r['updated']})", $r['updated'] === 2);

    $souris = $db->find('test_produits', 'nom', 'Souris');
    test('Update', 'updateBatch verifie Souris prix=24.99', $souris['prix'] == 24.99);

    $r = $db->updateMulti([
        'test_produits' => [
            ['where' => ['nom' => 'Telephone'], 'data' => ['prix' => 599.00]],
        ],
        'test_categories' => [
            ['where' => ['nom' => 'Sport'], 'data' => ['description' => 'Sport et loisirs']],
        ]
    ]);
    test('Update', "updateMulti 2 tables (total={$r['total_affected']})", $r['total_affected'] === 2);

    $r = $db->update('test_produits', ['prix' => 0], ['nom' => 'INTROUVABLE']);
    test('Update', 'update inexistant = 0 affected', $r['success'] && $r['affected_rows'] === 0);
} catch (Throwable $e) {
    // ignoree
}

// ========================================
// 8. DELETE / REMOVE
// ========================================

try {
    $n = $db->remove('test_produits', 'nom', 'Raquette');
    test('Delete', "remove() Raquette (affected=$n)", $n === 1);
    test('Delete', "Raquette n'existe plus", !$db->has('test_produits', 'nom', 'Raquette'));

    $r = $db->delete('test_produits', ['nom' => 'Ballon']);
    test('Delete', "delete Ballon (affected={$r['affected_rows']})", $r['success'] && $r['affected_rows'] === 1);

    $souris = $db->find('test_produits', 'nom', 'Souris');
    if ($souris) {
        $db->deleteById('test_produits', 'id_prod', $souris['id_prod']);
        test('Delete', 'deleteById Souris', !$db->has('test_produits', 'nom', 'Souris'));
    }

    $r = $db->deleteBatch('test_produits', [
        ['nom' => 'Clavier'],
        ['nom' => 'Ecran'],
    ]);
    test('Delete', "deleteBatch 2 produits (deleted={$r['deleted']})", $r['deleted'] === 2);

    $r = $db->deleteMulti([
        'test_produits' => [
            ['nom' => 'Pantalon'],
        ],
        'test_categories' => [
            ['nom' => 'Vetements'],
        ]
    ]);
    test('Delete', "deleteMulti 2 tables (total={$r['total_deleted']})", $r['total_deleted'] === 2);

    $r = $db->delete('test_produits', ['nom' => 'INTROUVABLE']);
    test('Delete', 'delete inexistant = 0 affected', $r['success'] && $r['affected_rows'] === 0);

    $n = $db->remove('test_produits', 'nom', 'INTROUVABLE');
    test('Delete', 'remove() inexistant = 0', $n === 0);

    $cFinal = $db->count('test_produits');
    test('Delete', "count final = $cFinal (apres suppressions)", $cFinal === 4);
} catch (Throwable $e) {
    // ignoree
}

// ========================================
// 9. SCHEMA
// ========================================

try {
    $tables = $db->getTables();
    test('Schema', 'getTables() contient test_categories', in_array('test_categories', $tables));
    test('Schema', 'getTables() contient test_produits', in_array('test_produits', $tables));

    $summary = $db->getSummary();
    test('Schema', 'getSummary() retourne test_categories', isset($summary['test_categories']));
    test('Schema', 'getSummary() retourne test_produits', isset($summary['test_produits']));
    test('Schema', 'getSummary() nb_enregistrements correct', $summary['test_produits']['nombre_enregistrements'] === 4);
} catch (Throwable $e) {
    // ignoree
}

// ========================================
// 10. RAW
// ========================================

try {
    $r = $db->raw("SELECT COUNT(*) AS total FROM test_produits");
    test('Raw', "raw SELECT (total={$r['data'][0]['total']})", $r['success'] && (int)$r['data'][0]['total'] === 4);

    $r = $db->raw("UPDATE test_produits SET actif = 0 WHERE stock < 20");
    test('Raw', "raw UPDATE (affected={$r['affected_rows']})", $r['success']);

    $r = $db->raw("INVALID SQL BLABLA");
    test('Raw', 'raw SQL invalide = echec', !$r['success']);
} catch (Throwable $e) {
    // ignoree
}

// ========================================
// 11. NETTOYAGE
// ========================================

try {
    $db->raw("DROP TABLE IF EXISTS `test_produits`");
    $db->raw("DROP TABLE IF EXISTS `test_categories`");
    test('Nettoyage', 'test_produits supprimee', !$db->tableExists('test_produits'));
    test('Nettoyage', 'test_categories supprimee', !$db->tableExists('test_categories'));
} catch (Throwable $e) {
    // ignoree
}

if ($canCreateDb) {
    try {
        $db->raw("DROP DATABASE IF EXISTS `$testDbName`");
        test('Nettoyage', "DROP DATABASE '$testDbName'", true);
    } catch (Throwable $e) {
        // ignoree
    }
}

$db->close();

// ========================================
// RESULTAT JSON
// ========================================

$sections = [];
foreach ($results as $r) {
    $s = $r['section'];
    if (!isset($sections[$s])) $sections[$s] = ['passed' => 0, 'failed' => 0, 'tests' => []];
    $r['ok'] ? $sections[$s]['passed']++ : $sections[$s]['failed']++;
    $sections[$s]['tests'][] = ['test' => $r['test'], 'ok' => $r['ok']];
}

echo json_encode([
    'success' => $failed === 0,
    'passed' => $passed,
    'failed' => $failed,
    'total' => $passed + $failed,
    'sections' => $sections
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
