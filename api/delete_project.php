<?php
// API — Supprimer un projet (DELETE)
// Depend de : _auth.php, config.php ($conn)
// Utilise par : front JS (fetch)
//
// DELETE /api/delete_project.php
//   Body : { "id": 5 }
//   → Supprime le projet (si proprietaire)

require_once __DIR__ . '/_auth.php';

$user = requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    jsonResponse(['error' => 'Methode non autorisee'], 405);
}

$body = getJsonBody();
$id = (int)($body['id'] ?? 0);

if ($id <= 0) {
    jsonResponse(['error' => 'id requis'], 400);
}

// Verifier propriete
$stmt = $conn->prepare("SELECT id FROM projects WHERE id = ? AND user_id = ?");
$stmt->bind_param('ii', $id, $user['id']);
$stmt->execute();
if ($stmt->get_result()->num_rows === 0) {
    jsonResponse(['error' => 'Projet introuvable ou non autorise'], 403);
}

// Supprimer
$stmt = $conn->prepare("DELETE FROM projects WHERE id = ? AND user_id = ?");
$stmt->bind_param('ii', $id, $user['id']);
$stmt->execute();

jsonResponse(['success' => true, 'message' => 'Projet supprime']);
