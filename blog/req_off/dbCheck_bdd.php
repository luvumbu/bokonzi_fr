<?php
/**
 * dbCheck_bdd.php — Creation schema BDD / DB schema creation
 * FR: Cree les tables, cles etrangeres et utilisateur initial
 * EN: Creates tables, foreign keys and initial user
 */
header("Access-Control-Allow-Origin: *");
require_once "../Class/DatabaseHandler.php";
$source_dbcheck = "../info_exe/dbCheck.php";

// ======================================================
// FR: Recuperation des valeurs POST / EN: Retrieve POST values
$dbname   = $_POST["dbname"]   ?? '';
$username = $_POST["username"] ?? '';
$password = $_POST["password"] ?? '';

// ======================================================
// Connexion DB
$databaseHandler = new DatabaseHandler($dbname, $username, $password);

// Récupération des tables existantes
$tables = $databaseHandler->getAllTables();

// ======================================================
// 1️⃣ TABLE profil_user
$columnsProfilUser = [
    "id_user" => "INT UNSIGNED AUTO_INCREMENT PRIMARY KEY",
    "nom_user" => "VARCHAR(100) NOT NULL",
    "prenom_user" => "VARCHAR(100) NOT NULL",
    "email_user" => "VARCHAR(150) NOT NULL UNIQUE",
    "password_user" => "VARCHAR(255) NOT NULL",
    "date_inscription_user" => "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
];
$tableName = "profil_user";
if (!in_array($tableName, $tables, true)) {
    $databaseHandler->create_table($tableName, $columnsProfilUser);
}

// ======================================================
// 2️⃣ TABLE projet  ✅ MODIF ICI
$columnsProjet = [
    "id_projet" => "INT UNSIGNED AUTO_INCREMENT PRIMARY KEY",
    "id_user_projet" => "INT UNSIGNED NOT NULL",
    "google_title" => "TEXT",
    "use_html_google_title" => "TEXT",
    "use_html_metacontent" => "TEXT",
    "use_html_description_projet"=>"TEXT",
    "metacontent" => "TEXT",
    "price" => "INT UNSIGNED NOT NULL",
    "active_voix_vocale"=>"INT UNSIGNED NOT NULL",
    "active_visibilite" => "INT UNSIGNED NOT NULL",
    "active_qr_code" => "INT UNSIGNED NOT NULL",
    "name_projet" => "TEXT",
    "use_html_project_name"=>"TEXT",
    "parent_projet" => "INT UNSIGNED DEFAULT NULL",
    "description_projet" => "TEXT",
    "password_projet"=>"TEXT",
    // 🔥 ICI : TEXT → INT (liaison image)
    "img_projet" => "INT UNSIGNED DEFAULT NULL",

    "date_inscription_projet" => "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
];
$tableName = "projet";
if (!in_array($tableName, $tables, true)) {
    $databaseHandler->create_table($tableName, $columnsProjet);
}

// FK projet → profil_user
$successFK1 = $databaseHandler->addForeignKey(
    "projet",
    "id_user_projet",
    "profil_user",
    "id_user",
    "CASCADE",
    "CASCADE"
);

// FK projet → projet (parent)
$successFKParent = $databaseHandler->addForeignKey(
    "projet",
    "parent_projet",
    "projet",
    "id_projet",
    "CASCADE",
    "CASCADE"
);

// ======================================================
// 3️⃣ TABLE style
$columnsStyle = [
    "id_style" => "INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY",
    "id_projet_style" => "INT(10) UNSIGNED",
    "id_parent_style" => "INT(10) UNSIGNED",
    "name_style" => "VARCHAR(20)",
    "date_inscription_style" => "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
];
$tableName = "style";
if (!in_array($tableName, $tables, true)) {
    $databaseHandler->create_table($tableName, $columnsStyle);
}
$successFKStyle = $databaseHandler->addForeignKey(
    "style",
    "id_projet_style",
    "projet",
    "id_projet",
    "CASCADE",
    "CASCADE"
);

// ======================================================
// 4️⃣ TABLE projet_params
$columnsProjetParams = [
    "id_param" => "INT UNSIGNED AUTO_INCREMENT PRIMARY KEY",
    "id_projet_param" => "INT UNSIGNED NOT NULL",
    "active_qr_code" => "TINYINT(1) DEFAULT 0",
    "active_visibilite" => "TINYINT(1) DEFAULT 1",
    "title" => "VARCHAR(255) DEFAULT ''",
    "description" => "TEXT DEFAULT NULL",
    "prix" => "DECIMAL(10,2) DEFAULT 0.00",
    "metacontent" => "TEXT DEFAULT NULL",
    "google_title" => "VARCHAR(255) DEFAULT ''",
    "date_debut" => "DATE DEFAULT NULL",
    "date_fin" => "DATE DEFAULT NULL",
    "date_inscription_param" => "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
];
$tableName = "projet_params";
if (!in_array($tableName, $tables, true)) {
    $databaseHandler->create_table($tableName, $columnsProjetParams);
}
$successFKParams = $databaseHandler->addForeignKey(
    "projet_params",
    "id_projet_param",
    "projet",
    "id_projet",
    "CASCADE",
    "CASCADE"
);

// ======================================================
// 5️⃣ TABLE projet_img
$columnsProjetImg = [
    "id_projet_img_auto" => "INT UNSIGNED AUTO_INCREMENT PRIMARY KEY",
    "id_user_img" => "INT UNSIGNED NOT NULL",
    "id_projet_img" => "INT UNSIGNED NOT NULL",
    "img_projet_src_img" => "LONGTEXT NOT NULL",
    "extension_img" => "VARCHAR(10)",
    "date_inscription_projet_img" => "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    "is_selected" => "TINYINT UNSIGNED DEFAULT 0",
    "is_checked" => "TINYINT UNSIGNED DEFAULT 0"
];
$tableName = "projet_img";
if (!in_array($tableName, $tables, true)) {
    $databaseHandler->create_table($tableName, $columnsProjetImg);
}

// FK projet_img → profil_user
$successFKImgUser = $databaseHandler->addForeignKey(
    "projet_img",
    "id_user_img",
    "profil_user",
    "id_user",
    "CASCADE",
    "CASCADE"
);

// FK projet_img → projet
$successFK2 = $databaseHandler->addForeignKey(
    "projet_img",
    "id_projet_img",
    "projet",
    "id_projet",
    "CASCADE",
    "CASCADE"
);

// 🔥 FK projet → projet_img (IMAGE PRINCIPALE)
$successFKImgProjet = $databaseHandler->addForeignKey(
    "projet",
    "img_projet",
    "projet_img",
    "id_projet_img_auto",
    "SET NULL",
    "CASCADE"
);

// ======================================================
// 6️⃣ TABLE social_media
$columnsSocialMedia = [
    "id_social" => "INT UNSIGNED AUTO_INCREMENT PRIMARY KEY",
    "id_user_social" => "INT UNSIGNED NOT NULL",
    "nom_social" => "VARCHAR(100) NOT NULL",
    "img_social" => "LONGTEXT",
    "url_social" => "TEXT NOT NULL",
    "date_inscription_social" => "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
];
$tableName = "social_media";
if (!in_array($tableName, $tables, true)) {
    $databaseHandler->create_table($tableName, $columnsSocialMedia);
}
$successFKSocial = $databaseHandler->addForeignKey(
    "social_media",
    "id_user_social",
    "profil_user",
    "id_user",
    "CASCADE",
    "CASCADE"
);

// ======================================================
// 👤 AJOUT UTILISATEUR
$userData = [
    'nom_user' => $dbname,
    'prenom_user' => $username,
    'email_user' => "",
    'password_user' => $password
];
$resultUser = $databaseHandler->insert_safe("profil_user", $userData, "email_user");

// ======================================================
// ✅ CRÉATION dbCheck.php
if (
    $successFK1 &&
    $successFKParent &&
    $successFKStyle &&
    $successFKParams &&
    $successFK2 &&
    $successFKImgUser &&
    $successFKImgProjet
) {
    $content = <<<PHP
<?php
\$dbname = "{$dbname}";
\$username = "{$username}";
\$password = "{$password}";
?>
PHP;
    file_put_contents($source_dbcheck, $content);
}

// ======================================================
$databaseHandler->closeConnection();
