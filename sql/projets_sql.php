<?php
// Requetes SQL — gestion des projets (sync, visibilite, auteur)
// Depend de : config.php ($conn)
// Utilise par : pages/dashboard.php
//
// +-------------------------------+----------------------------------------------+
// | Fonction                      | Detail                                       |
// +-------------------------------+----------------------------------------------+
// | syncProjets($conn, $dir)      | Synchronise dossiers physiques avec la BDD   |
// | getProjets($conn, $isAdmin)   | Liste les projets (tous si admin, visibles sinon) |
// | getProjetsPendants($conn)     | Projets sans visibilite ou sans auteur       |
// | toggleVisibilite($conn, $id)  | Bascule visible/invisible                    |
// | setAuteur($conn, $id, $uid)   | Definit l'auteur d'un projet                |
// | updateProjetInfo($conn,...)   | Met a jour titre, description, image         |
// | getMesProjets($conn, $uid)    | Projets dont l'utilisateur est auteur        |
// | isProjetOwner($conn,pid,uid)  | Verifie si l'utilisateur est auteur du projet|
// | getUsers($conn)               | Liste tous les utilisateurs                  |
// +-------------------------------+----------------------------------------------+

/**
 * Synchronise les dossiers physiques avec la table projets.
 * Ajoute les nouveaux dossiers, supprime les entrees orphelines.
 */
function syncProjets($conn, $projetsDir) {
    $dossiers = [];
    if (is_dir($projetsDir)) {
        foreach (scandir($projetsDir) as $entry) {
            if ($entry === '.' || $entry === '..') continue;
            if (is_dir($projetsDir . '/' . $entry)) {
                $dossiers[] = $entry;
            }
        }
    }

    // Ajouter les dossiers absents de la BDD avec valeurs sprite aleatoires
    $colors = ['#6c5ce7','#e84393','#00b894','#fdcb6e','#0984e3','#d63031','#e17055','#00cec9'];
    $stmt = $conn->prepare("INSERT IGNORE INTO projets (nom, sprite_size, sprite_force, sprite_speed, sprite_color) VALUES (?, ?, ?, ?, ?)");
    foreach ($dossiers as $nom) {
        $size = rand(70, 130);
        $force = rand(60, 150);
        $speed = rand(60, 150);
        $color = $colors[array_rand($colors)];
        $stmt->bind_param('siiis', $nom, $size, $force, $speed, $color);
        $stmt->execute();
    }

    // Supprimer les entrees dont le dossier n'existe plus
    if (!empty($dossiers)) {
        $placeholders = implode(',', array_fill(0, count($dossiers), '?'));
        $types = str_repeat('s', count($dossiers));
        $stmt = $conn->prepare("DELETE FROM projets WHERE nom NOT IN ($placeholders)");
        $stmt->bind_param($types, ...$dossiers);
        $stmt->execute();
    } else {
        $conn->query("DELETE FROM projets");
    }
}

/**
 * Liste les projets. Admin voit tout, les autres voient visible = 1 uniquement.
 */
function getProjets($conn, $isAdmin = false) {
    if ($isAdmin) {
        $result = $conn->query("SELECT p.*, u.name AS auteur_nom FROM projets p LEFT JOIN users u ON p.auteur_id = u.id ORDER BY p.nom");
    } else {
        $result = $conn->query("SELECT p.*, u.name AS auteur_nom FROM projets p LEFT JOIN users u ON p.auteur_id = u.id WHERE p.visible = 1 ORDER BY p.nom");
    }
    $projets = [];
    while ($row = $result->fetch_assoc()) {
        $projets[] = $row;
    }
    return $projets;
}

/**
 * Projets qui n'ont pas encore d'auteur attribue.
 */
function getProjetsPendants($conn) {
    $result = $conn->query("SELECT * FROM projets WHERE auteur_id IS NULL ORDER BY nom");
    $projets = [];
    while ($row = $result->fetch_assoc()) {
        $projets[] = $row;
    }
    return $projets;
}

/**
 * Bascule la visibilite d'un projet.
 */
function toggleVisibilite($conn, $projetId, $visible) {
    $v = $visible ? 1 : 0;
    $stmt = $conn->prepare("UPDATE projets SET visible = ? WHERE id = ?");
    $stmt->bind_param('ii', $v, $projetId);
    $stmt->execute();
}

/**
 * Definit l'auteur d'un projet.
 */
function setAuteur($conn, $projetId, $userId) {
    if ($userId > 0) {
        $stmt = $conn->prepare("UPDATE projets SET auteur_id = ? WHERE id = ?");
        $stmt->bind_param('ii', $userId, $projetId);
    } else {
        $stmt = $conn->prepare("UPDATE projets SET auteur_id = NULL WHERE id = ?");
        $stmt->bind_param('i', $projetId);
    }
    $stmt->execute();
}

/**
 * Met a jour titre, description et image d'un projet.
 */
function updateProjetInfo($conn, $projetId, $titre, $description, $image = null) {
    if ($image !== null) {
        $stmt = $conn->prepare("UPDATE projets SET titre = ?, description = ?, image = ? WHERE id = ?");
        $stmt->bind_param('sssi', $titre, $description, $image, $projetId);
    } else {
        $stmt = $conn->prepare("UPDATE projets SET titre = ?, description = ? WHERE id = ?");
        $stmt->bind_param('ssi', $titre, $description, $projetId);
    }
    $stmt->execute();
}

/**
 * Projets dont l'utilisateur est auteur.
 */
function getMesProjets($conn, $userId) {
    $stmt = $conn->prepare("SELECT p.*, u.name AS auteur_nom FROM projets p LEFT JOIN users u ON p.auteur_id = u.id WHERE p.auteur_id = ? ORDER BY p.nom");
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $projets = [];
    while ($row = $result->fetch_assoc()) {
        $projets[] = $row;
    }
    return $projets;
}

/**
 * Verifie si l'utilisateur est l'auteur d'un projet.
 */
function isProjetOwner($conn, $projetId, $userId) {
    $stmt = $conn->prepare("SELECT id FROM projets WHERE id = ? AND auteur_id = ?");
    $stmt->bind_param('ii', $projetId, $userId);
    $stmt->execute();
    return $stmt->get_result()->num_rows > 0;
}

/**
 * Cree un dossier projet physique + entree BDD, attribue a l'utilisateur.
 * Retourne true si succes, false si le nom existe deja.
 */
function createProjet($conn, $projetsDir, $nom, $userId) {
    // Nettoyer le nom (alphanum, tirets, underscores)
    $nom = preg_replace('/[^a-zA-Z0-9_-]/', '_', trim($nom));
    if ($nom === '') return false;

    $path = $projetsDir . '/' . $nom;
    if (is_dir($path)) return false;

    // Creer le dossier
    if (!mkdir($path, 0755, true)) return false;

    // Creer un index.html vide
    file_put_contents($path . '/index.html', "<!DOCTYPE html>\n<html><head><title>" . htmlspecialchars($nom) . "</title></head>\n<body><h1>" . htmlspecialchars($nom) . "</h1></body></html>\n");

    // Valeurs sprite aleatoires pour que chaque projet soit unique
    $size = rand(70, 130);
    $force = rand(60, 150);
    $speed = rand(60, 150);
    $colors = ['#6c5ce7','#e84393','#00b894','#fdcb6e','#0984e3','#d63031','#e17055','#00cec9'];
    $color = $colors[array_rand($colors)];

    $stmt = $conn->prepare("INSERT INTO projets (nom, auteur_id, visible, sprite_size, sprite_force, sprite_speed, sprite_color) VALUES (?, ?, 1, ?, ?, ?, ?)");
    $stmt->bind_param('siiiss', $nom, $userId, $size, $force, $speed, $color);
    $stmt->execute();

    return true;
}

/**
 * Liste tous les utilisateurs (pour le select auteur).
 */
function getUsers($conn) {
    $result = $conn->query("SELECT id, name, email, is_admin FROM users ORDER BY name");
    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
    return $users;
}

/**
 * Met a jour les parametres sprite d'un projet.
 */
function updateSpriteParams($conn, $projetId, $size, $force, $color, $speed) {
    $size = max(30, min(200, (int)$size));
    $force = max(10, min(300, (int)$force));
    $speed = max(10, min(300, (int)$speed));
    $color = preg_match('/^#[0-9a-fA-F]{6}$/', $color) ? $color : '#6c5ce7';
    $stmt = $conn->prepare("UPDATE projets SET sprite_size = ?, sprite_force = ?, sprite_color = ?, sprite_speed = ? WHERE id = ?");
    $stmt->bind_param('iisii', $size, $force, $color, $speed, $projetId);
    $stmt->execute();
}

/**
 * Recupere les permissions globales.
 */
function getPermissions($conn) {
    $result = $conn->query("SELECT * FROM global_permissions WHERE id = 1");
    return $result->fetch_assoc();
}

/**
 * Met a jour les permissions globales.
 */
function updatePermissions($conn, $perms) {
    $fields = ['create_projet', 'edit_info', 'toggle_visible', 'create_file', 'edit_file', 'delete_file'];
    foreach ($fields as $f) {
        $v = !empty($perms[$f]) ? 1 : 0;
        $conn->query("UPDATE global_permissions SET `$f` = $v WHERE id = 1");
    }
}

/**
 * Verifie si une permission est accordee (admin a toujours tout).
 */
function canDo($perms, $action, $isAdmin) {
    if ($isAdmin) return true;
    return !empty($perms[$action]);
}

/**
 * Promouvoir ou revoquer un admin.
 */
function setAdmin($conn, $userId, $isAdmin) {
    $v = $isAdmin ? 1 : 0;
    $stmt = $conn->prepare("UPDATE users SET is_admin = ? WHERE id = ?");
    $stmt->bind_param('ii', $v, $userId);
    $stmt->execute();
}
