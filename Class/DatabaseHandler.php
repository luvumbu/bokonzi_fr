<?php
// Gestionnaire de base de donnees MySQL — ORM leger (36 methodes)
// Depend de : rien (classe autonome, necessite extension mysqli)
// Utilise par : Class/DatabaseHandler_tests.php, docs/DatabaseHandler_exemples.php
//
// +--------------------+----------------------------------------------+
// | Categorie          | Methodes                                     |
// +--------------------+----------------------------------------------+
// | Connexion          | __construct, getConnection, close             |
// | Creation           | createTable, createTableFromArray, tableExists|
// | Insertion          | insert, insertMultiple, add                   |
// | Selection          | select, selectWhere, first, last, find, findWhere |
// | Recherche          | search, searchMultiple, has                   |
// | Jointure           | selectJoin                                   |
// | Mise a jour        | update, updateMulti, edit                     |
// | Suppression        | delete, deleteBatch, truncate, dropTable, remove |
// | Schema             | addColumn, removeColumn, getColumns, describe |
// | SQL brut           | rawQuery, rawSelect                          |
// | Utilitaires        | count, paginate, beginTransaction, commit, rollback |
// +--------------------+----------------------------------------------+

class DatabaseHandler
{
    private $conn;
    private $dbname;

    /**
     * Constructeur — connexion a la BDD
     * @param string $dbname Nom de la base
     * @param string $username Utilisateur MySQL
     * @param string $password Mot de passe MySQL
     * @param string $host Serveur (defaut: localhost)
     */
    function __construct($dbname, $username, $password, $host = 'localhost')
    {
        $this->dbname = $dbname;
        $this->conn = new mysqli($host, $username, $password, $dbname);
        if ($this->conn->connect_error) {
            throw new Exception("Erreur de connexion a '$dbname' : " . $this->conn->connect_error);
        }
        $this->conn->set_charset('utf8mb4');
    }

    /** Fermer la connexion */
    function close()
    {
        if ($this->conn) {
            $this->conn->close();
            $this->conn = null;
        }
    }

    /** Retourne la connexion mysqli brute */
    function getConnection()
    {
        return $this->conn;
    }

    // ========================================
    // SCHEMA — Tables et colonnes
    // ========================================

    /** Liste toutes les tables de la BDD */
    function getTables()
    {
        $tables = [];
        $result = $this->conn->query("SHOW TABLES");
        if ($result) {
            while ($row = $result->fetch_array()) {
                $tables[] = $row[0];
            }
        }
        return $tables;
    }

    /** Verifie si une table existe */
    function tableExists($table)
    {
        $table = $this->conn->real_escape_string($table);
        $result = $this->conn->query("SHOW TABLES LIKE '$table'");
        return $result && $result->num_rows > 0;
    }

    /** Liste les colonnes d'une table */
    function getColumns($table)
    {
        $columns = [];
        $result = $this->conn->query("SHOW COLUMNS FROM `" . $this->conn->real_escape_string($table) . "`");
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $columns[] = $row['Field'];
            }
        }
        return $columns;
    }

    /** Resume de toutes les tables (nom, colonnes, nb enregistrements) */
    function getSummary()
    {
        $summary = [];
        foreach ($this->getTables() as $table) {
            $count = $this->count($table);
            $summary[$table] = [
                'nom' => $table,
                'colonnes' => $this->getColumns($table),
                'nombre_colonnes' => count($this->getColumns($table)),
                'nombre_enregistrements' => $count
            ];
        }
        return $summary;
    }

    // ========================================
    // CREATE — Tables et FK
    // ========================================

    /**
     * Cree une table
     * @param string $table Nom de la table
     * @param array $columns ['nom_colonne' => 'TYPE SQL', ...]
     */
    function createTable($table, $columns)
    {
        if (empty($table) || empty($columns)) return false;

        $cols = [];
        foreach ($columns as $name => $type) {
            $cols[] = "`$name` $type";
        }

        $sql = "CREATE TABLE IF NOT EXISTS `$table` (" . implode(", ", $cols) . ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
        return $this->conn->query($sql);
    }

    /**
     * Ajoute une cle etrangere
     * @param string $table Table source
     * @param string $column Colonne FK
     * @param string $refTable Table reference
     * @param string $refColumn Colonne reference
     * @param string $onDelete CASCADE|SET NULL|RESTRICT
     * @param string $onUpdate CASCADE|SET NULL|RESTRICT
     */
    function addForeignKey($table, $column, $refTable, $refColumn, $onDelete = 'CASCADE', $onUpdate = 'CASCADE')
    {
        $constraint = "fk_{$table}_{$column}_{$refTable}_{$refColumn}";

        // Verifier si la FK existe deja
        $stmt = $this->conn->prepare("SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?");
        $stmt->bind_param('ss', $table, $constraint);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) return true;

        $sql = "ALTER TABLE `$table` ADD CONSTRAINT `$constraint` FOREIGN KEY (`$column`) REFERENCES `$refTable`(`$refColumn`) ON DELETE $onDelete ON UPDATE $onUpdate";
        return $this->conn->query($sql);
    }

    // ========================================
    // SELECT — Lecture de donnees
    // ========================================

    /**
     * Requete SELECT personnalisee (prepare statement)
     * @param string $sql Requete SQL (avec ? pour les params)
     * @param array $params Valeurs a binder
     * @return array ['success' => bool, 'data' => array, 'message' => string]
     */
    function select($sql, $params = [])
    {
        try {
            $stmt = $this->conn->prepare($sql);
            if (!$stmt) {
                return ['success' => false, 'message' => $this->conn->error, 'data' => []];
            }

            if (!empty($params)) {
                $types = '';
                foreach ($params as $p) {
                    if (is_int($p)) $types .= 'i';
                    elseif (is_float($p)) $types .= 'd';
                    else $types .= 's';
                }
                $stmt->bind_param($types, ...$params);
            }

            $stmt->execute();
            $result = $stmt->get_result();

            $rows = [];
            while ($row = $result->fetch_assoc()) {
                $rows[] = $row;
            }

            return ['success' => true, 'data' => $rows, 'message' => ''];
        } catch (mysqli_sql_exception $e) {
            return ['success' => false, 'message' => $e->getMessage(), 'data' => []];
        }
    }

    /**
     * Recupere toutes les donnees d'une table
     * @param string $table Nom de la table
     * @return array Tableau de lignes
     */
    function selectAll($table)
    {
        $table = $this->conn->real_escape_string($table);
        return $this->select("SELECT * FROM `$table`")['data'];
    }

    /**
     * Recupere toutes les tables avec leurs donnees
     * @return array ['table1' => [...], 'table2' => [...]]
     */
    function selectAllTables()
    {
        $allData = [];
        foreach ($this->getTables() as $table) {
            $allData[$table] = $this->selectAll($table);
        }
        return $allData;
    }

    /**
     * Verifie si un enregistrement existe
     * @param string $sql Requete SQL (avec ? pour les params)
     * @param array $params Valeurs a binder
     * @return array|false Premiere ligne ou false
     */
    function exists($sql, $params = [])
    {
        $result = $this->select($sql, $params);
        if ($result['success'] && !empty($result['data'])) {
            return $result['data'][0];
        }
        return false;
    }

    /**
     * Compte les enregistrements d'une table
     * @param string $table Nom de la table
     * @return int
     */
    function count($table)
    {
        $table = $this->conn->real_escape_string($table);
        $result = $this->conn->query("SELECT COUNT(*) AS total FROM `$table`");
        return $result ? (int)$result->fetch_assoc()['total'] : 0;
    }

    /**
     * Premier enregistrement d'une table
     * @param string $table Nom de la table
     * @param string $orderBy Colonne de tri
     */
    function first($table, $orderBy)
    {
        $table = $this->conn->real_escape_string($table);
        $orderBy = $this->conn->real_escape_string($orderBy);
        $result = $this->conn->query("SELECT * FROM `$table` ORDER BY `$orderBy` ASC LIMIT 1");
        return ($result && $result->num_rows > 0) ? $result->fetch_assoc() : false;
    }

    /**
     * Dernier enregistrement d'une table
     * @param string $table Nom de la table
     * @param string $orderBy Colonne de tri
     */
    function last($table, $orderBy)
    {
        $table = $this->conn->real_escape_string($table);
        $orderBy = $this->conn->real_escape_string($orderBy);
        $result = $this->conn->query("SELECT * FROM `$table` ORDER BY `$orderBy` DESC LIMIT 1");
        return ($result && $result->num_rows > 0) ? $result->fetch_assoc() : false;
    }

    /**
     * Dernier enregistrement (auto-detecte PK ou colonne date)
     * @param string $table Nom de la table
     */
    function lastAuto($table)
    {
        $table = $this->conn->real_escape_string($table);

        // 1. Cherche la cle primaire
        $res = $this->conn->query("SHOW KEYS FROM `$table` WHERE Key_name = 'PRIMARY'");
        if ($res && $res->num_rows > 0) {
            $pk = $res->fetch_assoc()['Column_name'];
            return $this->last($table, $pk);
        }

        // 2. Sinon cherche une colonne date/datetime/timestamp
        $res = $this->conn->query("SHOW COLUMNS FROM `$table`");
        while ($col = $res->fetch_assoc()) {
            if (preg_match('/timestamp|datetime|date/i', $col['Type'])) {
                return $this->last($table, $col['Field']);
            }
        }

        return false;
    }

    // ========================================
    // SEARCH — Recherche LIKE
    // ========================================

    /**
     * Recherche LIKE sur une colonne
     * @param string $table Table
     * @param string $column Colonne
     * @param string $value Valeur recherchee
     * @param int $limit Max resultats
     */
    function search($table, $column, $value, $limit = 10)
    {
        $sql = "SELECT * FROM `" . $this->conn->real_escape_string($table) . "` WHERE `" . $this->conn->real_escape_string($column) . "` LIKE ? LIMIT ?";
        $like = "%$value%";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('si', $like, $limit);
        $stmt->execute();
        $result = $stmt->get_result();

        $rows = [];
        while ($row = $result->fetch_assoc()) {
            $rows[] = $row;
        }
        return $rows;
    }

    /**
     * Recherche LIKE sur plusieurs colonnes
     * @param string $table Table
     * @param array $columns Colonnes a chercher
     * @param string $value Valeur recherchee
     * @param int $limit Max resultats
     */
    function searchMultiple($table, $columns, $value, $limit = 10)
    {
        if (empty($columns)) return [];

        $table = $this->conn->real_escape_string($table);
        $like = "%" . $this->conn->real_escape_string($value) . "%";
        $limit = (int)$limit;

        $conditions = [];
        foreach ($columns as $col) {
            $col = $this->conn->real_escape_string($col);
            $conditions[] = "`$col` LIKE '$like'";
        }

        $sql = "SELECT * FROM `$table` WHERE " . implode(' OR ', $conditions) . " LIMIT $limit";
        $result = $this->conn->query($sql);

        $rows = [];
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $rows[] = $row;
            }
        }
        return $rows;
    }

    // ========================================
    // JOIN — Jointures
    // ========================================

    /**
     * JOIN entre 2 tables
     * @param string $table1 Table principale
     * @param string $table2 Table secondaire
     * @param string $key1 Cle dans table1
     * @param string $key2 Cle dans table2
     * @param array $columns Colonnes a selectionner (vide = *)
     * @param string $type Type de join (INNER, LEFT, RIGHT)
     */
    function join($table1, $table2, $key1, $key2, $columns = [], $type = 'INNER')
    {
        $select = empty($columns) ? '*' : implode(', ', $columns);
        $sql = "SELECT $select FROM `$table1` t1 $type JOIN `$table2` t2 ON t1.`$key1` = t2.`$key2`";

        $result = $this->conn->query($sql);
        if (!$result) return ['success' => false, 'message' => $this->conn->error, 'data' => []];

        $rows = [];
        while ($row = $result->fetch_assoc()) {
            $rows[] = $row;
        }
        return ['success' => true, 'data' => $rows];
    }

    // ========================================
    // INSERT — Ajout de donnees
    // ========================================

    /**
     * Insert multi-tables — insere automatiquement dans plusieurs tables
     * Le tableau est indexe par nom de table, chaque valeur est un tableau de lignes
     *
     * @param array $dataset [
     *     'users' => [
     *         ['name' => 'Alice', 'email' => 'alice@test.com'],
     *         ['name' => 'Bob', 'email' => 'bob@test.com'],
     *     ],
     *     'projets' => [
     *         ['nom_projet' => 'Projet A', 'id_utilisateur' => 1],
     *     ]
     * ]
     * @param array $uniqueKeys Colonnes uniques par table ['users' => 'email', 'projets' => 'nom_projet']
     * @return array ['success' => bool, 'details' => ['table' => ['inserted' => int, 'skipped' => int, 'errors' => [...]]], 'total_inserted' => int]
     */
    function insertMulti($dataset, $uniqueKeys = [])
    {
        if (empty($dataset) || !is_array($dataset)) {
            return ['success' => false, 'message' => 'Dataset vide', 'details' => [], 'total_inserted' => 0];
        }

        $details = [];
        $totalInserted = 0;

        foreach ($dataset as $table => $rows) {
            // Verifier que la table existe
            if (!$this->tableExists($table)) {
                $details[$table] = ['inserted' => 0, 'skipped' => 0, 'errors' => ["Table '$table' inexistante"]];
                continue;
            }

            // Si $rows est un tableau associatif (1 seule ligne), l'emballer
            if (!empty($rows) && !isset($rows[0])) {
                $rows = [$rows];
            }

            $inserted = 0;
            $skipped = 0;
            $errors = [];
            $uniqueCol = $uniqueKeys[$table] ?? null;

            foreach ($rows as $i => $row) {
                if (!is_array($row) || empty($row)) {
                    $skipped++;
                    continue;
                }

                $result = $this->insert($table, $row, $uniqueCol);
                if ($result['success']) {
                    $inserted++;
                } else {
                    $skipped++;
                    $errors[] = "Ligne $i : " . $result['message'];
                }
            }

            $details[$table] = [
                'inserted' => $inserted,
                'skipped' => $skipped,
                'errors' => $errors
            ];
            $totalInserted += $inserted;
        }

        return [
            'success' => $totalInserted > 0,
            'details' => $details,
            'total_inserted' => $totalInserted
        ];
    }

    /**
     * Insert batch — insere plusieurs lignes dans UNE table
     * @param string $table Table cible
     * @param array $rows [['col1' => 'val1', ...], ['col1' => 'val2', ...]]
     * @param string|null $uniqueColumn Colonne unique (verifie les doublons)
     * @return array ['success' => bool, 'inserted' => int, 'skipped' => int, 'errors' => [...]]
     */
    function insertBatch($table, $rows, $uniqueColumn = null)
    {
        $result = $this->insertMulti([$table => $rows], $uniqueColumn ? [$table => $uniqueColumn] : []);
        return [
            'success' => $result['success'],
            'inserted' => $result['details'][$table]['inserted'] ?? 0,
            'skipped' => $result['details'][$table]['skipped'] ?? 0,
            'errors' => $result['details'][$table]['errors'] ?? []
        ];
    }

    /**
     * Insere un enregistrement (prepare statement)
     * @param string $table Table cible
     * @param array $data ['colonne' => 'valeur', ...]
     * @param string|null $uniqueColumn Colonne unique (verifie les doublons)
     * @return array ['success' => bool, 'id' => int|null, 'message' => string]
     */
    function insert($table, $data, $uniqueColumn = null)
    {
        if (empty($table) || empty($data)) {
            return ['success' => false, 'message' => 'Table ou donnees manquantes', 'id' => null];
        }

        try {
            // Verifier doublon si colonne unique specifiee
            if ($uniqueColumn && isset($data[$uniqueColumn])) {
                $check = $this->exists(
                    "SELECT 1 FROM `" . $this->conn->real_escape_string($table) . "` WHERE `$uniqueColumn` = ?",
                    [$data[$uniqueColumn]]
                );
                if ($check) {
                    return ['success' => false, 'message' => "$uniqueColumn deja present", 'id' => null];
                }
            }

            // Preparer INSERT
            $cols = implode('`, `', array_keys($data));
            $placeholders = implode(', ', array_fill(0, count($data), '?'));
            $sql = "INSERT INTO `$table` (`$cols`) VALUES ($placeholders)";

            $stmt = $this->conn->prepare($sql);
            if (!$stmt) {
                return ['success' => false, 'message' => $this->conn->error, 'id' => null];
            }

            $values = array_values($data);
            $types = '';
            foreach ($values as $v) {
                if (is_int($v)) $types .= 'i';
                elseif (is_float($v)) $types .= 'd';
                else $types .= 's';
            }
            $stmt->bind_param($types, ...$values);
            $stmt->execute();

            return ['success' => true, 'id' => $this->conn->insert_id, 'message' => 'Insere'];
        } catch (mysqli_sql_exception $e) {
            if ($e->getCode() === 1062) {
                return ['success' => false, 'message' => 'Donnee deja existante', 'id' => null];
            }
            return ['success' => false, 'message' => $e->getMessage(), 'id' => null];
        }
    }

    /**
     * Import batch depuis un fichier PHP contenant $data
     * @param string $table Table cible
     * @param string $filePath Chemin du fichier PHP
     * @return array ['success' => bool, 'inserted' => int]
     */
    function insertFromFile($table, $filePath)
    {
        if (!file_exists($filePath)) {
            return ['success' => false, 'message' => "Fichier $filePath introuvable", 'inserted' => 0];
        }

        include $filePath;
        if (!isset($data) || !is_array($data)) {
            return ['success' => false, 'message' => "Aucune donnee valide dans $filePath", 'inserted' => 0];
        }

        $count = 0;
        foreach ($data as $row) {
            if (!is_array($row) || empty($row)) continue;
            $result = $this->insert($table, $row);
            if ($result['success']) $count++;
        }

        return ['success' => true, 'inserted' => $count];
    }

    // ========================================
    // UPDATE — Mise a jour
    // ========================================

    /**
     * Update multi-tables — met a jour automatiquement dans plusieurs tables
     *
     * @param array $dataset [
     *     'users' => [
     *         ['data' => ['name' => 'Alice Modifie'], 'where' => ['id' => 1]],
     *         ['data' => ['name' => 'Bob Modifie'], 'where' => ['id' => 2]],
     *     ],
     *     'projets' => [
     *         ['data' => ['description' => 'Nouveau'], 'where' => ['id_projet' => 5]],
     *     ]
     * ]
     * @return array ['success' => bool, 'details' => [...], 'total_affected' => int]
     */
    function updateMulti($dataset)
    {
        if (empty($dataset) || !is_array($dataset)) {
            return ['success' => false, 'message' => 'Dataset vide', 'details' => [], 'total_affected' => 0];
        }

        $details = [];
        $totalAffected = 0;

        foreach ($dataset as $table => $rows) {
            if (!$this->tableExists($table)) {
                $details[$table] = ['updated' => 0, 'skipped' => 0, 'errors' => ["Table '$table' inexistante"]];
                continue;
            }

            // Si c'est 1 seule operation (pas de [0]), l'emballer
            if (!empty($rows) && isset($rows['data'])) {
                $rows = [$rows];
            }

            $updated = 0;
            $skipped = 0;
            $errors = [];

            foreach ($rows as $i => $row) {
                if (!isset($row['data']) || !isset($row['where']) || empty($row['data']) || empty($row['where'])) {
                    $skipped++;
                    $errors[] = "Ligne $i : 'data' et 'where' requis";
                    continue;
                }

                $result = $this->update($table, $row['data'], $row['where']);
                if ($result['success']) {
                    $updated += $result['affected_rows'];
                } else {
                    $skipped++;
                    $errors[] = "Ligne $i : " . $result['message'];
                }
            }

            $details[$table] = ['updated' => $updated, 'skipped' => $skipped, 'errors' => $errors];
            $totalAffected += $updated;
        }

        return ['success' => $totalAffected > 0, 'details' => $details, 'total_affected' => $totalAffected];
    }

    /**
     * Update batch — met a jour plusieurs lignes dans UNE table
     * @param string $table Table cible
     * @param array $rows [['data' => [...], 'where' => [...]], ...]
     * @return array ['success' => bool, 'updated' => int, 'skipped' => int, 'errors' => [...]]
     */
    function updateBatch($table, $rows)
    {
        $result = $this->updateMulti([$table => $rows]);
        return [
            'success' => $result['success'],
            'updated' => $result['details'][$table]['updated'] ?? 0,
            'skipped' => $result['details'][$table]['skipped'] ?? 0,
            'errors' => $result['details'][$table]['errors'] ?? []
        ];
    }

    /**
     * Met a jour des enregistrements (prepare statement)
     * @param string $table Table cible
     * @param array $data ['colonne' => 'nouvelle_valeur', ...]
     * @param array $where ['colonne' => 'valeur', ...] (conditions AND)
     * @return array ['success' => bool, 'affected_rows' => int, 'message' => string]
     */
    function update($table, $data, $where)
    {
        if (empty($table) || empty($data) || empty($where)) {
            return ['success' => false, 'message' => 'Table, donnees ou WHERE manquant', 'affected_rows' => 0];
        }

        try {
            // SET
            $setParts = [];
            $values = [];
            $types = '';
            foreach ($data as $col => $val) {
                $setParts[] = "`$col` = ?";
                $values[] = $val;
                $types .= is_int($val) ? 'i' : (is_float($val) ? 'd' : 's');
            }

            // WHERE
            $whereParts = [];
            foreach ($where as $col => $val) {
                $whereParts[] = "`$col` = ?";
                $values[] = $val;
                $types .= is_int($val) ? 'i' : (is_float($val) ? 'd' : 's');
            }

            $sql = "UPDATE `$table` SET " . implode(', ', $setParts) . " WHERE " . implode(' AND ', $whereParts);

            $stmt = $this->conn->prepare($sql);
            if (!$stmt) {
                return ['success' => false, 'message' => $this->conn->error, 'affected_rows' => 0];
            }

            $stmt->bind_param($types, ...$values);
            $stmt->execute();

            return ['success' => true, 'affected_rows' => $stmt->affected_rows, 'message' => ''];
        } catch (mysqli_sql_exception $e) {
            return ['success' => false, 'message' => $e->getMessage(), 'affected_rows' => 0];
        }
    }

    // ========================================
    // DELETE — Suppression
    // ========================================

    /**
     * Delete multi-tables — supprime automatiquement dans plusieurs tables
     *
     * @param array $dataset [
     *     'users' => [
     *         ['id' => 1],
     *         ['id' => 2],
     *         ['email' => 'bob@test.com'],
     *     ],
     *     'projets' => [
     *         ['id_projet' => 5],
     *         ['id_utilisateur' => 3, 'nom_projet' => 'Projet X'],
     *     ]
     * ]
     * @return array ['success' => bool, 'details' => [...], 'total_deleted' => int]
     */
    function deleteMulti($dataset)
    {
        if (empty($dataset) || !is_array($dataset)) {
            return ['success' => false, 'message' => 'Dataset vide', 'details' => [], 'total_deleted' => 0];
        }

        $details = [];
        $totalDeleted = 0;

        foreach ($dataset as $table => $rows) {
            if (!$this->tableExists($table)) {
                $details[$table] = ['deleted' => 0, 'skipped' => 0, 'errors' => ["Table '$table' inexistante"]];
                continue;
            }

            // Si c'est 1 seule condition (pas de [0]), l'emballer
            if (!empty($rows) && !isset($rows[0])) {
                $rows = [$rows];
            }

            $deleted = 0;
            $skipped = 0;
            $errors = [];

            foreach ($rows as $i => $where) {
                if (!is_array($where) || empty($where)) {
                    $skipped++;
                    $errors[] = "Ligne $i : condition WHERE vide";
                    continue;
                }

                $result = $this->delete($table, $where);
                if ($result['success'] && $result['affected_rows'] > 0) {
                    $deleted += $result['affected_rows'];
                } else {
                    $skipped++;
                    if (!$result['success']) {
                        $errors[] = "Ligne $i : " . $result['message'];
                    }
                }
            }

            $details[$table] = ['deleted' => $deleted, 'skipped' => $skipped, 'errors' => $errors];
            $totalDeleted += $deleted;
        }

        return ['success' => $totalDeleted > 0, 'details' => $details, 'total_deleted' => $totalDeleted];
    }

    /**
     * Delete batch — supprime plusieurs lignes dans UNE table
     * @param string $table Table cible
     * @param array $rows [['id' => 1], ['id' => 2], ...] (chaque element = conditions WHERE)
     * @return array ['success' => bool, 'deleted' => int, 'skipped' => int, 'errors' => [...]]
     */
    function deleteBatch($table, $rows)
    {
        $result = $this->deleteMulti([$table => $rows]);
        return [
            'success' => $result['success'],
            'deleted' => $result['details'][$table]['deleted'] ?? 0,
            'skipped' => $result['details'][$table]['skipped'] ?? 0,
            'errors' => $result['details'][$table]['errors'] ?? []
        ];
    }

    /**
     * Supprime des enregistrements (prepare statement)
     * @param string $table Table cible
     * @param array $where ['colonne' => 'valeur', ...] (conditions AND)
     * @return array ['success' => bool, 'affected_rows' => int, 'message' => string]
     */
    function delete($table, $where)
    {
        if (empty($table) || empty($where)) {
            return ['success' => false, 'message' => 'Table ou WHERE manquant', 'affected_rows' => 0];
        }

        try {
            $whereParts = [];
            $values = [];
            $types = '';
            foreach ($where as $col => $val) {
                $whereParts[] = "`$col` = ?";
                $values[] = $val;
                $types .= is_int($val) ? 'i' : (is_float($val) ? 'd' : 's');
            }

            $sql = "DELETE FROM `$table` WHERE " . implode(' AND ', $whereParts);

            $stmt = $this->conn->prepare($sql);
            if (!$stmt) {
                return ['success' => false, 'message' => $this->conn->error, 'affected_rows' => 0];
            }

            $stmt->bind_param($types, ...$values);
            $stmt->execute();

            return ['success' => true, 'affected_rows' => $stmt->affected_rows, 'message' => ''];
        } catch (mysqli_sql_exception $e) {
            return ['success' => false, 'message' => $e->getMessage(), 'affected_rows' => 0];
        }
    }

    /**
     * Supprime par ID
     * @param string $table Table
     * @param string $idColumn Nom de la colonne ID
     * @param int $idValue Valeur de l'ID
     */
    function deleteById($table, $idColumn, $idValue)
    {
        return $this->delete($table, [$idColumn => (int)$idValue]);
    }

    // ========================================
    // RACCOURCIS — Operations simplifiees
    // ========================================

    /**
     * Ajouter 1 ou plusieurs lignes (detecte automatiquement)
     * @param string $table Nom de la table
     * @param array $data ['col'=>val] pour 1 ligne, ou [['col'=>val], ...] pour plusieurs
     * @param string|null $uniqueCol Colonne a verifier pour eviter les doublons
     *
     * Exemples :
     *   $db->add('users', ['name'=>'Alice', 'email'=>'a@t.com'])
     *   $db->add('users', [['name'=>'Alice'], ['name'=>'Bob']], 'email')
     */
    function add($table, $data, $uniqueCol = null)
    {
        if (!empty($data) && array_keys($data) !== range(0, count($data) - 1)) {
            return $this->insert($table, $data, $uniqueCol);
        }
        return $this->insertBatch($table, $data, $uniqueCol);
    }

    /**
     * Chercher par colonne + valeur
     * @param string $table Table
     * @param string|null $col Colonne (null = tout)
     * @param mixed $val Valeur
     *
     * Exemples :
     *   $db->find('users')                   → toutes les lignes
     *   $db->find('users', 'id', 10)         → 1 ligne ou id=10
     *   $db->find('users', 'locale', 'fr')   → lignes ou locale='fr'
     */
    function find($table, $col = null, $val = null)
    {
        if ($col === null) return $this->selectAll($table);

        $result = $this->select("SELECT * FROM `" . $this->conn->real_escape_string($table) . "` WHERE `" . $this->conn->real_escape_string($col) . "` = ?", [$val]);
        if (!$result['success']) return null;
        if (count($result['data']) === 0) return null;
        if (count($result['data']) === 1) return $result['data'][0];
        return $result['data'];
    }

    /**
     * Chercher avec plusieurs conditions WHERE
     * @param string $table Table
     * @param array $where ['col'=>val, 'col2'=>val2]
     *
     * Exemple :
     *   $db->findWhere('users', ['name'=>'Alice', 'locale'=>'fr'])
     */
    function findWhere($table, $where)
    {
        $cols = array_keys($where);
        $vals = array_values($where);
        $conds = implode(' AND ', array_map(fn($c) => "`$c` = ?", $cols));
        $table = $this->conn->real_escape_string($table);

        $result = $this->select("SELECT * FROM `$table` WHERE $conds", $vals);
        if (!$result['success']) return null;
        if (count($result['data']) === 0) return null;
        if (count($result['data']) === 1) return $result['data'][0];
        return $result['data'];
    }

    /**
     * Verifier si un enregistrement existe
     * @param string $table Table
     * @param string $col Colonne
     * @param mixed $val Valeur
     *
     * Exemple :
     *   $db->has('users', 'email', 'a@t.com')  → true/false
     */
    function has($table, $col, $val)
    {
        return $this->find($table, $col, $val) !== null;
    }

    /**
     * Modifier par colonne + valeur
     * @param string $table Table
     * @param string $col Colonne WHERE
     * @param mixed $val Valeur WHERE
     * @param array $data Nouvelles valeurs
     * @return int Lignes modifiees
     *
     * Exemple :
     *   $db->edit('users', 'id', 10, ['name'=>'Nouveau nom'])
     */
    function edit($table, $col, $val, $data)
    {
        $result = $this->update($table, $data, [$col => $val]);
        return $result['affected_rows'] ?? 0;
    }

    /**
     * Supprimer par colonne + valeur
     * @param string $table Table
     * @param string $col Colonne WHERE
     * @param mixed $val Valeur WHERE
     * @return int Lignes supprimees
     *
     * Exemple :
     *   $db->remove('users', 'id', 10)
     */
    function remove($table, $col, $val)
    {
        $result = $this->delete($table, [$col => $val]);
        return $result['affected_rows'] ?? 0;
    }

    // ========================================
    // RAW — Requete SQL brute
    // ========================================

    /**
     * Execute une requete SQL brute
     * @param string $sql Requete SQL
     * @return array ['success' => bool, 'data' => array|null, 'id' => int|null, 'affected_rows' => int]
     */
    function raw($sql)
    {
        try {
            $result = $this->conn->query($sql);

            if ($result === true) {
                return [
                    'success' => true,
                    'id' => $this->conn->insert_id ?: null,
                    'affected_rows' => $this->conn->affected_rows,
                    'data' => null
                ];
            }

            if ($result instanceof mysqli_result) {
                $rows = [];
                while ($row = $result->fetch_assoc()) {
                    $rows[] = $row;
                }
                return ['success' => true, 'data' => $rows, 'id' => null, 'affected_rows' => 0];
            }

            return ['success' => false, 'message' => $this->conn->error, 'data' => null];
        } catch (mysqli_sql_exception $e) {
            return ['success' => false, 'message' => $e->getMessage(), 'data' => null];
        }
    }
}
