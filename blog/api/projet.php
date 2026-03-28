<?php
/**
 * api/projet.php — API REST pour les projets et sous-projets
 * Depend de : Class/DatabaseHandler.php, info_exe/dbCheck.php
 *
 * POST   /api/projet.php              → Creer un projet racine
 * POST   /api/projet.php?parent=ID    → Creer un sous-projet
 * GET    /api/projet.php?user=ID      → Lister les projets d'un user
 * GET    /api/projet.php?id=ID        → Charger un projet
 * GET    /api/projet.php?children=ID  → Lister les sous-projets
 * DELETE /api/projet.php              → Supprimer un projet {id}
 */
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../Class/DatabaseHandler.php';
require_once __DIR__ . '/../Class/Language.php';
Language::init('fr');
require_once __DIR__ . '/../info_exe/dbCheck.php';

// Auth : session obligatoire
$sessionUser = $_SESSION["info_index"][1][0] ?? null;
if (!$sessionUser) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Non connecte']);
    exit;
}
$userId = (int)$sessionUser['id_user'];

$db = new DatabaseHandler($dbname, $username, $password);
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    // ============================================================
    // GET — Lire
    // ============================================================
    case 'GET':
        // Charger un projet par ID
        if (isset($_GET['id'])) {
            $id = (int)$_GET['id'];
            $sql = "SELECT * FROM `projet` WHERE `id_projet` = $id";
            $result = $db->select_custom_safe($sql, 'rows');
            if ($result['success'] && !empty($rows)) {
                respond(200, ['success' => true, 'projet' => $rows[0]]);
            } else {
                respond(404, ['success' => false, 'error' => 'Projet introuvable']);
            }
        }
        // Lister les sous-projets
        elseif (isset($_GET['children'])) {
            $parentId = (int)$_GET['children'];
            $sql = "SELECT p.*, ip.img_projet_src_img AS main_img_src
                    FROM projet p
                    LEFT JOIN projet_img ip ON p.img_projet = ip.id_projet_img_auto
                    WHERE p.parent_projet = $parentId AND p.id_user_projet = $userId
                    ORDER BY p.date_inscription_projet DESC";
            $result = $db->select_custom_safe($sql, 'rows');
            respond(200, ['success' => true, 'projets' => $result['success'] ? $rows : []]);
        }
        // Lister les projets racine d'un user
        else {
            $uid = isset($_GET['user']) ? (int)$_GET['user'] : $userId;
            $sql = "SELECT p.*, ip.img_projet_src_img AS main_img_src
                    FROM projet p
                    LEFT JOIN projet_img ip ON p.img_projet = ip.id_projet_img_auto
                    WHERE p.id_user_projet = $uid AND p.parent_projet IS NULL
                    ORDER BY p.date_inscription_projet DESC";
            $result = $db->select_custom_safe($sql, 'rows');
            respond(200, ['success' => true, 'projets' => $result['success'] ? $rows : []]);
        }
        break;

    // ============================================================
    // POST — Creer
    // ============================================================
    case 'POST':
        $body = json_decode(file_get_contents('php://input'), true);
        if (!$body) $body = $_POST;

        $projectData = [
            'id_user_projet' => $userId,
            'name_projet' => $body['name'] ?? '',
            'description_projet' => $body['description'] ?? ''
        ];

        // Sous-projet
        $parentId = $body['parent_projet'] ?? $_GET['parent'] ?? null;
        if ($parentId) {
            $parentId = (int)$parentId;
            // Verifier que le parent existe et appartient au user
            $sql = "SELECT id_projet FROM projet WHERE id_projet = $parentId AND id_user_projet = $userId";
            $check = $db->select_custom_safe($sql, 'parent');
            if (!$check['success'] || empty($parent)) {
                respond(403, ['success' => false, 'error' => 'Parent introuvable ou pas proprietaire']);
            }
            $projectData['parent_projet'] = $parentId;
        }

        $resultProjet = $db->insert_safe('projet', $projectData, 'id_projet');
        if (!$resultProjet['success']) {
            respond(500, ['success' => false, 'error' => 'Echec creation projet', 'detail' => $resultProjet['message']]);
        }

        $idProjet = $resultProjet['id'];

        // Style par defaut
        $db->insert_safe('style', ['id_projet_style' => $idProjet], 'id_style');
        // Params par defaut
        $db->insert_safe('projet_params', ['id_projet_param' => $idProjet], 'id_param');

        $_SESSION["idProjet"] = $idProjet;

        respond(201, [
            'success' => true,
            'id' => $idProjet,
            'parent' => $parentId ? (int)$parentId : null
        ]);
        break;

    // ============================================================
    // DELETE — Supprimer
    // ============================================================
    case 'DELETE':
        $body = json_decode(file_get_contents('php://input'), true);
        if (!$body) parse_str(file_get_contents('php://input'), $body);
        $id = (int)($body['id'] ?? 0);

        if ($id <= 0) {
            respond(400, ['success' => false, 'error' => 'ID manquant']);
        }

        // Verifier propriete
        $sql = "SELECT id_projet FROM projet WHERE id_projet = $id AND id_user_projet = $userId";
        $check = $db->select_custom_safe($sql, 'own');
        if (!$check['success'] || empty($own)) {
            respond(403, ['success' => false, 'error' => 'Projet introuvable ou pas proprietaire']);
        }

        // Supprimer les sous-projets recursivement
        deleteRecursive($db, $id);

        respond(200, ['success' => true, 'deleted' => $id]);
        break;

    default:
        respond(405, ['success' => false, 'error' => 'Methode non autorisee']);
}

$db->closeConnection();

// ============================================================
// Helpers
// ============================================================
function respond($code, $data) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function deleteRecursive($db, $id) {
    // Supprimer les enfants d'abord
    $sql = "SELECT id_projet FROM projet WHERE parent_projet = $id";
    $result = $db->select_custom_safe($sql, 'children');
    if ($result['success'] && !empty($children)) {
        foreach ($children as $child) {
            deleteRecursive($db, (int)$child['id_projet']);
        }
    }
    // Supprimer style, params, images, puis le projet
    $db->remove_sql_safe('style', ['id_projet_style' => $id]);
    $db->remove_sql_safe('projet_params', ['id_projet_param' => $id]);
    $db->remove_sql_safe('projet_img', ['id_projet_img' => $id]);
    $db->remove_sql_safe('projet', ['id_projet' => $id]);
}
