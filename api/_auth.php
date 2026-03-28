<?php
// Helper API — verification auth + reponse JSON
// Depend de : config.php
// Utilise par : api/save_project.php, api/get_projects.php, api/delete_project.php

require_once __DIR__ . '/../config.php';

header('Content-Type: application/json; charset=utf-8');

/**
 * Retourne l'utilisateur connecte ou arrete avec 401.
 */
function requireAuth() {
    if (!isset($_SESSION['user'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Non authentifie']);
        exit;
    }
    return $_SESSION['user'];
}

/**
 * Reponse JSON standard.
 */
function jsonResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Lit le body JSON du POST.
 */
function getJsonBody() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
        jsonResponse(['error' => 'JSON invalide'], 400);
    }
    return $data;
}
