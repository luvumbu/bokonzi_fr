<?php
/**
 * test_api_projet.php — Tests automatises pour l'API projet
 * Lance : php test_api_projet.php  OU  http://localhost/.../test/test_api_projet.php
 */
$isCli = (php_sapi_name() === 'cli');
if (!$isCli) echo "<pre style='background:#111;color:#0f0;padding:20px;font-size:14px;'>";

$baseUrl = 'http://localhost/dossier_bokonzi_fr/autre_projet';
$apiUrl = $baseUrl . '/api/projet.php';
$bridgeUrl = $baseUrl . '/bridge.php';
$passed = 0;
$failed = 0;
$errors = [];

// ============================================================
// 1. Setup : creer une session de test
// ============================================================
section("SETUP — Authentification");

$cookieFile = sys_get_temp_dir() . '/test_api_cookies.txt';
if (file_exists($cookieFile)) unlink($cookieFile);

// Initialiser la session via l'endpoint de test
$authResult = apiGet($baseUrl . '/test/test_auth_setup.php', $cookieFile);
assertTest('Auth setup', isset($authResult['success']) && $authResult['success'] === true, $authResult);
info("Session initialisee, user_id=" . ($authResult['user_id'] ?? '?'));

// ============================================================
// 2. TEST : Creer un projet racine
// ============================================================
section("POST — Creer un projet racine");

$result = apiPost($apiUrl, ['name' => 'Projet Test API', 'description' => 'Cree par test auto'], $cookieFile);
assertTest('Reponse success', isset($result['success']) && $result['success'] === true, $result);
assertTest('ID retourne', isset($result['id']) && $result['id'] > 0, $result);
assertTest('Pas de parent', !isset($result['parent']) || $result['parent'] === null, $result);

$projetId = $result['id'] ?? 0;
info("Projet racine cree : id=$projetId");

// ============================================================
// 3. TEST : Creer un sous-projet
// ============================================================
section("POST — Creer un sous-projet");

$result = apiPost($apiUrl . '?parent=' . $projetId, ['name' => 'Sous-projet Test', 'description' => 'Enfant'], $cookieFile);
assertTest('Sous-projet success', isset($result['success']) && $result['success'] === true, $result);
assertTest('ID sous-projet', isset($result['id']) && $result['id'] > 0, $result);
assertTest('Parent correct', isset($result['parent']) && (int)$result['parent'] === $projetId, $result);

$sousProjetId = $result['id'] ?? 0;
info("Sous-projet cree : id=$sousProjetId, parent=$projetId");

// ============================================================
// 4. TEST : Creer un sous-sous-projet
// ============================================================
section("POST — Creer un sous-sous-projet");

$result = apiPost($apiUrl . '?parent=' . $sousProjetId, ['name' => 'Sous-sous-projet', 'description' => 'Niveau 3'], $cookieFile);
assertTest('Sous-sous-projet success', isset($result['success']) && $result['success'] === true, $result);
$sousSousProjetId = $result['id'] ?? 0;
info("Sous-sous-projet cree : id=$sousSousProjetId");

// ============================================================
// 5. TEST : Lister les projets racine
// ============================================================
section("GET — Lister projets racine");

$result = apiGet($apiUrl, $cookieFile);
assertTest('Liste success', isset($result['success']) && $result['success'] === true, $result);
assertTest('Projets est un tableau', isset($result['projets']) && is_array($result['projets']), $result);

$found = false;
foreach ($result['projets'] ?? [] as $p) {
    if ((int)$p['id_projet'] === $projetId) { $found = true; break; }
}
assertTest('Projet racine dans la liste', $found, $result);
info("Projets racine : " . count($result['projets'] ?? []) . " trouves");

// ============================================================
// 6. TEST : Charger un projet par ID
// ============================================================
section("GET — Charger projet par ID");

$result = apiGet($apiUrl . '?id=' . $projetId, $cookieFile);
assertTest('Chargement success', isset($result['success']) && $result['success'] === true, $result);
assertTest('Nom correct', isset($result['projet']['name_projet']) && $result['projet']['name_projet'] === 'Projet Test API', $result);
info("Projet charge : " . ($result['projet']['name_projet'] ?? '?'));

// ============================================================
// 7. TEST : Lister les sous-projets
// ============================================================
section("GET — Lister sous-projets");

$result = apiGet($apiUrl . '?children=' . $projetId, $cookieFile);
assertTest('Children success', isset($result['success']) && $result['success'] === true, $result);
assertTest('Au moins 1 enfant', !empty($result['projets']), $result);

$foundChild = false;
foreach ($result['projets'] ?? [] as $p) {
    if ((int)$p['id_projet'] === $sousProjetId) { $foundChild = true; break; }
}
assertTest('Sous-projet dans la liste', $foundChild, $result);
info("Sous-projets de $projetId : " . count($result['projets'] ?? []) . " trouves");

// ============================================================
// 8. TEST : Supprimer le projet racine (cascade)
// ============================================================
section("DELETE — Supprimer projet racine (cascade)");

$result = apiDelete($apiUrl, ['id' => $projetId], $cookieFile);
assertTest('Delete success', isset($result['success']) && $result['success'] === true, $result);
assertTest('ID supprime correct', isset($result['deleted']) && (int)$result['deleted'] === $projetId, $result);
info("Projet $projetId supprime");

// Verifier que le sous-projet est aussi supprime
$result = apiGet($apiUrl . '?id=' . $sousProjetId, $cookieFile);
assertTest('Sous-projet aussi supprime', isset($result['success']) && $result['success'] === false, $result);

$result = apiGet($apiUrl . '?id=' . $sousSousProjetId, $cookieFile);
assertTest('Sous-sous-projet aussi supprime', isset($result['success']) && $result['success'] === false, $result);
info("Suppression recursive verifiee");

// ============================================================
// 9. TEST : Erreurs
// ============================================================
section("ERREURS — Cas limites");

// Sans session
$result = apiGet($apiUrl, null);
assertTest('401 sans session', isset($result['error']), $result);

// Supprimer un projet inexistant
$result = apiDelete($apiUrl, ['id' => 999999], $cookieFile);
assertTest('403 projet inexistant', isset($result['success']) && $result['success'] === false, $result);

// Creer sous-projet avec parent inexistant
$result = apiPost($apiUrl . '?parent=999999', ['name' => 'Orphelin'], $cookieFile);
assertTest('403 parent inexistant', isset($result['success']) && $result['success'] === false, $result);

// ============================================================
// RESULTAT
// ============================================================
echo "\n" . str_repeat('=', 50) . "\n";
$total = $passed + $failed;
echo "RESULTAT : $passed/$total passes";
if ($failed > 0) {
    echo " — $failed ECHEC(S)\n";
    foreach ($errors as $e) echo "  FAIL: $e\n";
} else {
    echo " — TOUT OK !\n";
}
echo str_repeat('=', 50) . "\n";

// Cleanup
if (file_exists($cookieFile)) unlink($cookieFile);
if (!$isCli) echo "</pre>";

// ============================================================
// Fonctions utilitaires
// ============================================================
function section($title) {
    echo "\n--- $title ---\n";
}

function info($msg) {
    echo "  > $msg\n";
}

function assertTest($name, $condition, $context = null) {
    global $passed, $failed, $errors;
    if ($condition) {
        echo "  OK  $name\n";
        $passed++;
    } else {
        echo "  FAIL  $name\n";
        $errors[] = $name . ($context ? ' => ' . json_encode($context) : '');
        $failed++;
    }
}

function httpGet($url, $cookieFile = null) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    if ($cookieFile) {
        curl_setopt($ch, CURLOPT_COOKIEJAR, $cookieFile);
        curl_setopt($ch, CURLOPT_COOKIEFILE, $cookieFile);
    }
    $body = curl_exec($ch);
    curl_close($ch);
    return $body;
}

function httpPost($url, $data, $cookieFile = null) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    if ($cookieFile) {
        curl_setopt($ch, CURLOPT_COOKIEJAR, $cookieFile);
        curl_setopt($ch, CURLOPT_COOKIEFILE, $cookieFile);
    }
    $body = curl_exec($ch);
    curl_close($ch);
    return $body;
}

function apiGet($url, $cookieFile = null) {
    $body = httpGet($url, $cookieFile);
    return json_decode($body, true) ?: ['raw' => $body];
}

function apiPost($url, $data, $cookieFile = null) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    if ($cookieFile) {
        curl_setopt($ch, CURLOPT_COOKIEJAR, $cookieFile);
        curl_setopt($ch, CURLOPT_COOKIEFILE, $cookieFile);
    }
    $body = curl_exec($ch);
    curl_close($ch);
    return json_decode($body, true) ?: ['raw' => $body];
}

function apiDelete($url, $data, $cookieFile = null) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    if ($cookieFile) {
        curl_setopt($ch, CURLOPT_COOKIEJAR, $cookieFile);
        curl_setopt($ch, CURLOPT_COOKIEFILE, $cookieFile);
    }
    $body = curl_exec($ch);
    curl_close($ch);
    return json_decode($body, true) ?: ['raw' => $body];
}
