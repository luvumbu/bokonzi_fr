<?php
/**
 * test_auth_setup.php — Initialise une session de test
 * A SUPPRIMER en production
 */
session_start();
header('Content-Type: application/json');

require_once __DIR__ . '/../Class/DatabaseHandler.php';
require_once __DIR__ . '/../info_exe/dbCheck.php';

// Creer la session du site principal (simule un admin connecte)
$_SESSION['user'] = [
    'id' => 1,
    'email' => 'admin@local',
    'name' => 'Administrateur',
    'given_name' => 'Admin',
    'family_name' => '',
    'picture' => '',
    'is_admin' => true
];

// Trouver ou creer le user dans profil_user
$conn = new mysqli('localhost', $username, $password, $dbname);
$conn->set_charset('utf8mb4');
$result = $conn->query("SELECT * FROM profil_user WHERE email_user = 'admin@local'");
if ($result && $result->num_rows > 0) {
    $profilUser = $result->fetch_assoc();
} else {
    $conn->query("INSERT INTO profil_user (prenom_user, nom_user, password_user, email_user) VALUES ('Admin', 'Test', '', 'admin@local')");
    $result = $conn->query("SELECT * FROM profil_user WHERE id_user = " . $conn->insert_id);
    $profilUser = $result->fetch_assoc();
}
$conn->close();

// Session info_index
$_SESSION["info_index"] = [
    0 => 'Session de test',
    1 => [$profilUser]
];

echo json_encode(['success' => true, 'user_id' => $profilUser['id_user']]);
