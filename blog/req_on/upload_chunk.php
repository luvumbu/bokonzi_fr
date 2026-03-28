<?php
/**
 * upload_chunk.php — Upload par morceaux / Chunked upload
 * FR: Recoit et assemble les morceaux de fichiers uploades
 * EN: Receives and assembles uploaded file chunks
 */
session_start();

$id_user = $_SESSION["info_index"][1][0]["id_user"] ?? null;
if (!$id_user) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Non autorisé']);
    exit;
}

// FR: Dossier de destination / EN: Destination folder
$uploadDir = __DIR__ . "/../uploads/";
if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

// Récupération des données POST
$chunkIndex = isset($_POST['chunkIndex']) ? intval($_POST['chunkIndex']) : null;
$totalChunks = isset($_POST['totalChunks']) ? intval($_POST['totalChunks']) : null;
$fileNameOriginal = isset($_POST['fileName']) ? basename($_POST['fileName']) : null;

if ($chunkIndex === null || $totalChunks === null || !$fileNameOriginal) {
    http_response_code(400);
    exit('Paramètres manquants.');
}

// Vérifie qu'un fichier est bien envoyé
if (!isset($_FILES['file']['tmp_name'])) {
    http_response_code(400);
    exit('Chunk manquant.');
}

$tmpFile = $_FILES['file']['tmp_name'];

// Génère un nom unique pour tout le fichier dès le premier chunk
if ($chunkIndex == 0) {
    $ext = pathinfo($fileNameOriginal, PATHINFO_EXTENSION);
    $newFileName = time() . ($ext ? "." . $ext : "");
    file_put_contents($uploadDir . ".tmp_name_map", $newFileName); // mémorisation temporaire
} else {
    $newFileName = file_get_contents($uploadDir . ".tmp_name_map");
}

$destination = $uploadDir . $newFileName;

// Si c'est le premier chunk et que le fichier existe, on le supprime
if ($chunkIndex == 0 && file_exists($destination)) {
    unlink($destination);
}

// Ajoute le chunk à la fin du fichier final
file_put_contents($destination, file_get_contents($tmpFile), FILE_APPEND);

// Si c'est le dernier chunk, vérifie si c'est une image et renvoie message final
if ($chunkIndex == $totalChunks - 1) {
    unlink($uploadDir . ".tmp_name_map"); // supprime le fichier temporaire de mapping

    $mime = mime_content_type($destination);
    if (strpos($mime, 'image/') === 0) {
        echo json_encode([
            'success' => true,
            'fileName' => $newFileName,
            'image' => true,
            'url' => 'uploads/' . $newFileName
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'fileName' => $newFileName,
            'image' => false
        ]);
    }
} else {
    echo json_encode([
        'success' => true,
        'chunkIndex' => $chunkIndex
    ]);
}
