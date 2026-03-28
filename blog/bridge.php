<?php
// Bridge d'authentification — connecte automatiquement depuis le dashboard principal
// Depend de : ../config.php (session du site principal), info_exe/dbCheck.php
// Utilise par : dashboard (lien Apps)
session_start();

// Verifier que l'utilisateur est connecte sur le site principal
if (!isset($_SESSION['user'])) {
    header('Location: ../auth/login.php');
    exit;
}

$mainUser = $_SESSION['user'];

// Charger les credentials BDD
require_once __DIR__ . '/info_exe/dbCheck.php';

// Determiner le host BDD
$dbHost = 'localhost';
// Sur Hostinger le host peut etre different
$credFile = __DIR__ . '/../.credentials.php';
if (file_exists($credFile)) {
    $creds = require $credFile;
    $dbHost = $creds['DB_HOST'] ?? 'localhost';
}

// Chercher ou creer l'utilisateur dans profil_user
$conn = new mysqli($dbHost, $username, $password, $dbname);
if ($conn->connect_error) {
    die('Erreur BDD: ' . $conn->connect_error);
}
$conn->set_charset('utf8mb4');

// Chercher par email
$email = $conn->real_escape_string($mainUser['email']);
$result = $conn->query("SELECT * FROM profil_user WHERE email_user = '$email'");

if ($result && $result->num_rows > 0) {
    $profilUser = $result->fetch_assoc();
} else {
    // Creer le user dans profil_user
    $prenom = $conn->real_escape_string($mainUser['given_name'] ?: $mainUser['name']);
    $nom = $conn->real_escape_string($mainUser['family_name'] ?? '');
    $conn->query("INSERT INTO profil_user (prenom_user, nom_user, password_user, email_user) VALUES ('$prenom', '$nom', '', '$email')");
    $newId = $conn->insert_id;
    $result = $conn->query("SELECT * FROM profil_user WHERE id_user = $newId");
    $profilUser = $result->fetch_assoc();
}

$conn->close();

// Remplir la session info_index
$_SESSION["info_index"] = [
    0 => 'Connecte via bokonzi.fr',
    1 => [$profilUser]
];

// Rediriger vers l'app (chemin absolu)
$appBase = str_replace('\\', '/', str_replace(str_replace('\\', '/', $_SERVER['DOCUMENT_ROOT']), '', str_replace('\\', '/', __DIR__))) . '/';
header('Location: ' . $appBase);
exit;
