<?php
// Initialisation BDD — creation base + table users
// Depend de : config.php ($conn, DB_NAME)
// Utilise par : config.php (require_once, appel initDatabase())
//
// +---------------------------+----------------------------------------------+
// | Action                    | Detail                                       |
// +---------------------------+----------------------------------------------+
// | CREATE DATABASE IF NOT    | BDD nommee par DB_NAME (.credentials.php)    |
// | CREATE TABLE IF NOT       | Table users (15 colonnes, InnoDB, utf8mb4)   |
// +---------------------------+----------------------------------------------+

function initDatabase($conn) {
    // Creer la BDD si elle n'existe pas
    $conn->query("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $conn->select_db(DB_NAME);

    // Creer la table users si elle n'existe pas
    $conn->query("CREATE TABLE IF NOT EXISTS `users` (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // Creer la table projets si elle n'existe pas
    $conn->query("CREATE TABLE IF NOT EXISTS `projets` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `nom` VARCHAR(255) NOT NULL UNIQUE,
        `titre` VARCHAR(255) DEFAULT NULL,
        `description` TEXT DEFAULT NULL,
        `image` VARCHAR(255) DEFAULT NULL,
        `auteur_id` INT DEFAULT NULL,
        `visible` TINYINT(1) DEFAULT NULL,
        `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
        `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (`auteur_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // Creer la table projects (sauvegardes JS des utilisateurs)
    $conn->query("CREATE TABLE IF NOT EXISTS `projects` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `user_id` INT NOT NULL,
        `name` VARCHAR(255) NOT NULL,
        `data_json` LONGTEXT NOT NULL,
        `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
        `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
        INDEX `idx_user` (`user_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // Creer la table des permissions globales (une seule ligne)
    $conn->query("CREATE TABLE IF NOT EXISTS `global_permissions` (
        `id` INT PRIMARY KEY DEFAULT 1,
        `create_projet` TINYINT(1) DEFAULT 1,
        `edit_info` TINYINT(1) DEFAULT 1,
        `toggle_visible` TINYINT(1) DEFAULT 1,
        `create_file` TINYINT(1) DEFAULT 1,
        `edit_file` TINYINT(1) DEFAULT 1,
        `delete_file` TINYINT(1) DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    // Inserer la ligne par defaut si vide
    $conn->query("INSERT IGNORE INTO global_permissions (id) VALUES (1)");

    // Migration users : ajouter is_admin si manquant
    $userCols = [];
    $res = $conn->query("SHOW COLUMNS FROM `users`");
    while ($row = $res->fetch_assoc()) {
        $userCols[] = $row['Field'];
    }
    if (!in_array('is_admin', $userCols)) {
        $conn->query("ALTER TABLE `users` ADD `is_admin` TINYINT(1) DEFAULT 0 AFTER `login_count`");
    }

    // Migration projets : ajouter les colonnes si elles manquent
    $cols = [];
    $res = $conn->query("SHOW COLUMNS FROM `projets`");
    while ($row = $res->fetch_assoc()) {
        $cols[] = $row['Field'];
    }
    if (!in_array('titre', $cols)) {
        $conn->query("ALTER TABLE `projets` ADD `titre` VARCHAR(255) DEFAULT NULL AFTER `nom`");
    }
    if (!in_array('description', $cols)) {
        $conn->query("ALTER TABLE `projets` ADD `description` TEXT DEFAULT NULL AFTER `titre`");
    }
    if (!in_array('image', $cols)) {
        $conn->query("ALTER TABLE `projets` ADD `image` VARCHAR(255) DEFAULT NULL AFTER `description`");
    }
    if (!in_array('sprite_size', $cols)) {
        $conn->query("ALTER TABLE `projets` ADD `sprite_size` INT DEFAULT 100 AFTER `visible`");
    }
    if (!in_array('sprite_force', $cols)) {
        $conn->query("ALTER TABLE `projets` ADD `sprite_force` INT DEFAULT 100 AFTER `sprite_size`");
    }
    if (!in_array('sprite_color', $cols)) {
        $conn->query("ALTER TABLE `projets` ADD `sprite_color` VARCHAR(7) DEFAULT '#6c5ce7' AFTER `sprite_force`");
    }
    if (!in_array('sprite_speed', $cols)) {
        $conn->query("ALTER TABLE `projets` ADD `sprite_speed` INT DEFAULT 100 AFTER `sprite_color`");
    }
}
