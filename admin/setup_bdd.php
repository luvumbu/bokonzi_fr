<?php
// Setup BDD — creation manuelle table users
// Depend de : config.php (.credentials.php + .google_oauth.php + sql/config_sql.php)
// Utilise par : acces direct (admin)
//
// +------------------+----------------------------------------------+
// | Action           | Detail                                       |
// +------------------+----------------------------------------------+
// | CREATE TABLE     | Table users (15 colonnes, InnoDB, utf8mb4)   |
// | DESCRIBE         | Affiche la structure de la table              |
// +------------------+----------------------------------------------+
require_once __DIR__ . '/../config.php';

$sql = "CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `google_id` VARCHAR(255) NOT NULL UNIQUE,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `email_verified` TINYINT(1) DEFAULT 0,
    `name` VARCHAR(255) DEFAULT '',
    `given_name` VARCHAR(255) DEFAULT '',
    `family_name` VARCHAR(255) DEFAULT '',
    `picture` TEXT DEFAULT NULL,
    `locale` VARCHAR(10) DEFAULT '',
    `gender` VARCHAR(20) DEFAULT '',
    `hd` VARCHAR(255) DEFAULT '',
    `login_count` INT DEFAULT 0,
    `last_login` DATETIME DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

if ($conn->query($sql)) {
    echo "<h2>Table `users` creee avec succes.</h2>";
} else {
    echo "<h2>Erreur : " . $conn->error . "</h2>";
}

// Afficher la structure
$result = $conn->query("DESCRIBE users");
if ($result) {
    echo "<table border='1' cellpadding='8' style='border-collapse:collapse; margin-top:20px; font-family:monospace;'>";
    echo "<tr style='background:#333;color:#fff;'><th>Champ</th><th>Type</th><th>Null</th><th>Cle</th><th>Defaut</th></tr>";
    while ($row = $result->fetch_assoc()) {
        echo "<tr><td>{$row['Field']}</td><td>{$row['Type']}</td><td>{$row['Null']}</td><td>{$row['Key']}</td><td>{$row['Default']}</td></tr>";
    }
    echo "</table>";
}
