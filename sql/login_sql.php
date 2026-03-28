<?php
// Requetes SQL — login admin (adminLogin)
// Depend de : config.php ($conn)
// Utilise par : auth/login.php
//
// +---------------------------+----------------------------------------------+
// | Fonction                  | Detail                                       |
// +---------------------------+----------------------------------------------+
// | adminLogin($conn)         | SELECT admin → UPDATE login_count ou INSERT  |
// | Retourne                  | ['id' => int, 'login_count' => int]          |
// +---------------------------+----------------------------------------------+

function adminLogin($conn) {
    // Chercher l'admin existant
    $stmt = $conn->prepare("SELECT id, login_count FROM users WHERE email = 'admin@local'");
    $stmt->execute();
    $result = $stmt->get_result();

    if ($admin = $result->fetch_assoc()) {
        // Incrementer le compteur
        $newCount = $admin['login_count'] + 1;
        $conn->query("UPDATE users SET login_count = $newCount, is_admin = 1, last_login = NOW() WHERE id = {$admin['id']}");
        return ['id' => $admin['id'], 'login_count' => $newCount];
    } else {
        // Creer l'admin
        $conn->query("INSERT INTO users (google_id, email, name, given_name, login_count, is_admin, last_login) VALUES ('admin', 'admin@local', 'Administrateur', 'Admin', 1, 1, NOW())");
        return ['id' => $conn->insert_id, 'login_count' => 1];
    }
}
