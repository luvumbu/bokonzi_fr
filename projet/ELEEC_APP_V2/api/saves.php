<?php
header('Content-Type: application/json');

$dir = __DIR__ . '/../constructions/';
if (!is_dir($dir)) mkdir($dir, 0777, true);

$action = $_GET['action'] ?? $_POST['action'] ?? '';

// Validation du format ELEEC
function validerFormat($data) {
    $erreurs = [];
    $warnings = [];

    if (!is_array($data)) {
        return ['valide' => false, 'erreurs' => ['Le fichier n\'est pas un JSON valide'], 'warnings' => []];
    }

    // Champ obligatoire : murs (tableau)
    if (!isset($data['murs']) || !is_array($data['murs'])) {
        $erreurs[] = 'Champ "murs" manquant ou invalide';
    } else {
        // Verifier chaque mur
        foreach ($data['murs'] as $i => $mur) {
            if (!isset($mur['distance']) || !is_numeric($mur['distance'])) {
                $erreurs[] = 'Mur ' . ($i+1) . ' : "distance" manquant';
                break;
            }
            if (!isset($mur['hauteur']) || !is_numeric($mur['hauteur'])) {
                $erreurs[] = 'Mur ' . ($i+1) . ' : "hauteur" manquant';
                break;
            }
        }
    }

    // Champs optionnels mais verifiables
    if (isset($data['exclusions']) && !is_array($data['exclusions'])) {
        $erreurs[] = 'Champ "exclusions" invalide (doit etre un tableau)';
    }
    if (isset($data['traits']) && !is_array($data['traits'])) {
        $erreurs[] = 'Champ "traits" invalide (doit etre un tableau)';
    }
    if (isset($data['placos']) && !is_array($data['placos'])) {
        $erreurs[] = 'Champ "placos" invalide (doit etre un tableau)';
    }
    if (isset($data['laines']) && !is_array($data['laines'])) {
        $erreurs[] = 'Champ "laines" invalide (doit etre un tableau)';
    }
    if (isset($data['piecesZones']) && !is_array($data['piecesZones'])) {
        $warnings[] = 'Champ "piecesZones" invalide';
    }

    // Warnings (pas bloquants)
    if (!isset($data['exclusions'])) $warnings[] = 'Pas de portes/fenetres';
    if (!isset($data['placos'])) $warnings[] = 'Pas de placos';
    if (!isset($data['laines'])) $warnings[] = 'Pas de laines';
    if (!isset($data['_date'])) $warnings[] = 'Pas de date de sauvegarde';
    if (!isset($data['_image'])) $warnings[] = 'Pas d\'image preview';

    return [
        'valide' => count($erreurs) === 0,
        'erreurs' => $erreurs,
        'warnings' => $warnings,
        'stats' => [
            'murs' => isset($data['murs']) ? count($data['murs']) : 0,
            'exclusions' => isset($data['exclusions']) ? count($data['exclusions']) : 0,
            'placos' => isset($data['placos']) ? count($data['placos']) : 0,
            'laines' => isset($data['laines']) ? count($data['laines']) : 0,
            'traits' => isset($data['traits']) ? count($data['traits']) : 0,
            'zones' => isset($data['piecesZones']) ? count($data['piecesZones']) : 0
        ]
    ];
}

// Lister les fichiers
if ($action === 'list') {
    $files = [];
    foreach (glob($dir . '*.json') as $f) {
        $name = basename($f, '.json');
        $size = filesize($f);
        $date = date('d/m/Y H:i', filemtime($f));
        $raw = file_get_contents($f);
        $data = json_decode($raw, true);
        $validation = validerFormat($data);
        $preview = ($data && isset($data['_image'])) ? $data['_image'] : null;

        $files[] = [
            'name' => $name,
            'size' => $size,
            'sizeHuman' => $size > 1048576 ? round($size/1048576, 1).'Mo' : round($size/1024, 1).'Ko',
            'date' => $date,
            'valide' => $validation['valide'],
            'erreurs' => $validation['erreurs'],
            'warnings' => $validation['warnings'],
            'stats' => $validation['stats'],
            'image' => $preview
        ];
    }
    usort($files, function($a, $b) { return strcmp($b['date'], $a['date']); });
    echo json_encode(['ok' => true, 'files' => $files]);
    exit;
}

// Sauvegarder
if ($action === 'save') {
    $name = $_POST['name'] ?? 'construction';
    $name = preg_replace('/[^a-zA-Z0-9_\-\x{00C0}-\x{017F} ]/u', '', $name);
    if (!$name) $name = 'construction';
    $json = $_POST['data'] ?? '';
    if (!$json) { echo json_encode(['ok' => false, 'error' => 'Pas de donnees']); exit; }

    // Valider avant de sauvegarder
    $data = json_decode($json, true);
    if (!$data) { echo json_encode(['ok' => false, 'error' => 'JSON invalide']); exit; }
    $validation = validerFormat($data);
    if (!$validation['valide']) {
        echo json_encode(['ok' => false, 'error' => 'Format invalide : ' . implode(', ', $validation['erreurs'])]);
        exit;
    }

    $path = $dir . $name . '.json';
    file_put_contents($path, $json);
    echo json_encode([
        'ok' => true,
        'name' => $name,
        'validation' => $validation
    ]);
    exit;
}

// Charger
if ($action === 'load') {
    $name = $_GET['name'] ?? '';
    $name = preg_replace('/[^a-zA-Z0-9_\-\x{00C0}-\x{017F} ]/u', '', $name);
    $path = $dir . $name . '.json';
    if (!file_exists($path)) { echo json_encode(['ok' => false, 'error' => 'Fichier introuvable']); exit; }
    $raw = file_get_contents($path);
    $data = json_decode($raw, true);
    if (!$data) { echo json_encode(['ok' => false, 'error' => 'JSON corrompu']); exit; }
    $validation = validerFormat($data);
    if (!$validation['valide']) {
        echo json_encode(['ok' => false, 'error' => 'Format invalide : ' . implode(', ', $validation['erreurs'])]);
        exit;
    }
    // Ajouter la validation au retour
    $data['_validation'] = $validation;
    echo json_encode($data);
    exit;
}

// Supprimer
if ($action === 'delete') {
    $name = $_POST['name'] ?? '';
    $name = preg_replace('/[^a-zA-Z0-9_\-\x{00C0}-\x{017F} ]/u', '', $name);
    $path = $dir . $name . '.json';
    if (file_exists($path)) {
        unlink($path);
        echo json_encode(['ok' => true]);
    } else {
        echo json_encode(['ok' => false, 'error' => 'Fichier introuvable']);
    }
    exit;
}

echo json_encode(['ok' => false, 'error' => 'Action inconnue']);
