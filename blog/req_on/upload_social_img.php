<?php
/**
 * upload_social_img.php — Upload image reseau social / Social media image upload
 * FR: Upload une image pour un reseau social et retourne le chemin
 * EN: Uploads an image for a social media entry and returns the path
 */
session_start();
header('Content-Type: application/json');

$id_user = $_SESSION["info_index"][1][0]["id_user"] ?? null;

if (!$id_user || empty($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['success' => false]);
    exit;
}

$uploadDir = __DIR__ . '/../uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$file = $_FILES['file'];
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico'];

if (!in_array($ext, $allowed)) {
    echo json_encode(['success' => false, 'message' => 'Format non autorisé']);
    exit;
}

$fileName = 'social_' . $id_user . '_' . time() . '.' . $ext;
$dest = $uploadDir . $fileName;

if (move_uploaded_file($file['tmp_name'], $dest)) {
    echo json_encode(['success' => true, 'path' => 'uploads/' . $fileName]);
} else {
    echo json_encode(['success' => false, 'message' => 'Erreur upload']);
}
