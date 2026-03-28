<?php
// API — Lister les projets de l'utilisateur (GET)
// Depend de : _auth.php, config.php ($conn)
// Utilise par : front JS (fetch)
//
// GET /api/get_projects.php
//   → Liste tous les projets de l'utilisateur connecte
//
// GET /api/get_projects.php?id=5
//   → Retourne un projet specifique (si proprietaire)

require_once __DIR__ . '/_auth.php';

$user = requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Methode non autorisee'], 405);
}

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id > 0) {
    // Un projet specifique
    $stmt = $conn->prepare("SELECT id, name, data_json, created_at, updated_at FROM projects WHERE id = ? AND user_id = ?");
    $stmt->bind_param('ii', $id, $user['id']);
    $stmt->execute();
    $result = $stmt->get_result();
    $project = $result->fetch_assoc();

    if (!$project) {
        jsonResponse(['error' => 'Projet introuvable'], 404);
    }

    $project['data'] = json_decode($project['data_json'], true);
    unset($project['data_json']);

    jsonResponse($project);

} else {
    // Tous les projets (sans data_json pour la liste)
    $stmt = $conn->prepare("SELECT id, name, created_at, updated_at FROM projects WHERE user_id = ? ORDER BY updated_at DESC");
    $stmt->bind_param('i', $user['id']);
    $stmt->execute();
    $result = $stmt->get_result();

    $projects = [];
    while ($row = $result->fetch_assoc()) {
        $projects[] = $row;
    }

    jsonResponse(['projects' => $projects, 'count' => count($projects)]);
}
