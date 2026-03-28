<?php
// Requetes SQL — upsert utilisateur Google (upsertGoogleUser)
// Depend de : config.php ($conn)
// Utilise par : auth/callback.php
//
// +-------------------------------+----------------------------------------------+
// | Fonction                      | Detail                                       |
// +-------------------------------+----------------------------------------------+
// | upsertGoogleUser($conn,$data) | SELECT google_id → UPDATE ou INSERT          |
// | Retourne                      | ['id' => int, 'login_count' => int]          |
// +-------------------------------+----------------------------------------------+

function upsertGoogleUser($conn, $userData) {
    $stmt = $conn->prepare("SELECT id, login_count, is_admin FROM users WHERE google_id = ?");
    $stmt->bind_param('s', $userData['google_id']);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($existing = $result->fetch_assoc()) {
        // Utilisateur existant : mettre a jour + incrementer compteur
        $newCount = $existing['login_count'] + 1;
        $stmt = $conn->prepare("UPDATE users SET email = ?, email_verified = ?, name = ?, given_name = ?, family_name = ?, picture = ?, locale = ?, gender = ?, hd = ?, login_count = ?, last_login = NOW() WHERE google_id = ?");
        $stmt->bind_param('sisssssssds',
            $userData['email'], $userData['email_verified'], $userData['name'],
            $userData['given_name'], $userData['family_name'], $userData['picture'],
            $userData['locale'], $userData['gender'], $userData['hd'],
            $newCount, $userData['google_id']
        );
        $stmt->execute();
        return ['id' => $existing['id'], 'login_count' => $newCount, 'is_admin' => (bool)$existing['is_admin']];
    } else {
        // Nouvel utilisateur
        $stmt = $conn->prepare("INSERT INTO users (google_id, email, email_verified, name, given_name, family_name, picture, locale, gender, hd, login_count, last_login) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())");
        $stmt->bind_param('ssisssssss',
            $userData['google_id'], $userData['email'], $userData['email_verified'],
            $userData['name'], $userData['given_name'], $userData['family_name'],
            $userData['picture'], $userData['locale'], $userData['gender'], $userData['hd']
        );
        $stmt->execute();
        return ['id' => $conn->insert_id, 'login_count' => 1, 'is_admin' => false];
    }
}
