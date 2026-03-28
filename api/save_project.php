<?php
// API — Sauvegarder un projet (POST) ou mettre a jour (PUT)
// Depend de : _auth.php, config.php ($conn)
// Utilise par : front JS (fetch)
//
// POST /api/save_project.php
//   Body : { "name": "Mon projet", "data": { ... } }
//   → Cree un nouveau projet
//
// PUT /api/save_project.php
//   Body : { "id": 5, "name": "Mon projet", "data": { ... } }
//   → Met a jour un projet existant (si proprietaire)

require_once __DIR__ . '/_auth.php';

$user = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $body = getJsonBody();
    $name = trim($body['name'] ?? '');
    $data = $body['data'] ?? null;

    if ($name === '' || $data === null) {
        jsonResponse(['error' => 'name et data requis'], 400);
    }

    $dataJson = json_encode($data, JSON_UNESCAPED_UNICODE);
    $stmt = $conn->prepare("INSERT INTO projects (user_id, name, data_json) VALUES (?, ?, ?)");
    $stmt->bind_param('iss', $user['id'], $name, $dataJson);
    $stmt->execute();

    jsonResponse([
        'success' => true,
        'id' => $conn->insert_id,
        'message' => 'Projet sauvegarde'
    ], 201);

} elseif ($method === 'PUT') {
    $body = getJsonBody();
    $id = (int)($body['id'] ?? 0);
    $name = trim($body['name'] ?? '');
    $data = $body['data'] ?? null;

    if ($id <= 0 || $name === '' || $data === null) {
        jsonResponse(['error' => 'id, name et data requis'], 400);
    }

    // Verifier que le projet appartient a l'utilisateur
    $stmt = $conn->prepare("SELECT id FROM projects WHERE id = ? AND user_id = ?");
    $stmt->bind_param('ii', $id, $user['id']);
    $stmt->execute();
    if ($stmt->get_result()->num_rows === 0) {
        jsonResponse(['error' => 'Projet introuvable ou non autorise'], 403);
    }

    $dataJson = json_encode($data, JSON_UNESCAPED_UNICODE);
    $stmt = $conn->prepare("UPDATE projects SET name = ?, data_json = ? WHERE id = ? AND user_id = ?");
    $stmt->bind_param('ssii', $name, $dataJson, $id, $user['id']);
    $stmt->execute();

    jsonResponse([
        'success' => true,
        'id' => $id,
        'message' => 'Projet mis a jour'
    ]);

} else {
    jsonResponse(['error' => 'Methode non autorisee'], 405);
}
