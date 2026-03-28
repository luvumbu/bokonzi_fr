<?php
// Callback Google OAuth — echange code, stocke user en BDD + session
// Depend de : config.php (BDD + OAuth via .google_oauth.php), sql/callback_sql.php
// Utilise par : Google (redirection apres authentification)
//
// +----------------------------+----------------------------------------------+
// | Etape                      | Action                                       |
// +----------------------------+----------------------------------------------+
// | 1. Verif state CSRF        | Compare $_GET['state'] vs $_SESSION          |
// | 2. Echange code → token    | POST googleapis.com/token                    |
// | 3. Recupere infos user     | GET googleapis.com/userinfo                  |
// | 4. Upsert BDD              | sql/callback_sql.php → upsertGoogleUser()   |
// | 5. Stocke session           | $_SESSION['user'] = [...]                    |
// | 6. Redirige                 | → index.php                                  |
// +----------------------------+----------------------------------------------+
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../sql/callback_sql.php';

// Verifier le state CSRF
if (!isset($_GET['state']) || $_GET['state'] !== ($_SESSION['oauth_state'] ?? '')) {
    die('Erreur : state CSRF invalide.');
}
unset($_SESSION['oauth_state']);

// Verifier le code d'autorisation
if (!isset($_GET['code'])) {
    die('Erreur : code d\'autorisation manquant.');
}

// Echanger le code contre un token
$tokenResponse = file_get_contents('https://oauth2.googleapis.com/token', false, stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/x-www-form-urlencoded',
        'content' => http_build_query([
            'code' => $_GET['code'],
            'client_id' => GOOGLE_CLIENT_ID,
            'client_secret' => GOOGLE_CLIENT_SECRET,
            'redirect_uri' => GOOGLE_REDIRECT_URI,
            'grant_type' => 'authorization_code'
        ])
    ]
]));

if (!$tokenResponse) {
    die('Erreur : impossible d\'obtenir le token.');
}

$tokenData = json_decode($tokenResponse, true);

if (!isset($tokenData['access_token'])) {
    die('Erreur : token invalide.');
}

// Recuperer les infos utilisateur
$userInfo = file_get_contents('https://www.googleapis.com/oauth2/v2/userinfo', false, stream_context_create([
    'http' => [
        'header' => 'Authorization: Bearer ' . $tokenData['access_token']
    ]
]));

if (!$userInfo) {
    die('Erreur : impossible de recuperer les infos utilisateur.');
}

$user = json_decode($userInfo, true);

// Preparer les donnees
$userData = [
    'google_id' => $user['id'] ?? '',
    'email' => $user['email'] ?? '',
    'email_verified' => !empty($user['verified_email']) ? 1 : 0,
    'name' => $user['name'] ?? '',
    'given_name' => $user['given_name'] ?? '',
    'family_name' => $user['family_name'] ?? '',
    'picture' => $user['picture'] ?? '',
    'locale' => $user['locale'] ?? '',
    'gender' => $user['gender'] ?? '',
    'hd' => $user['hd'] ?? ''
];

// Inserer ou mettre a jour en BDD
$dbResult = upsertGoogleUser($conn, $userData);

// Stocker en session
$_SESSION['user'] = [
    'id' => $dbResult['id'],
    'google_id' => $userData['google_id'],
    'email' => $userData['email'],
    'name' => $userData['name'],
    'given_name' => $userData['given_name'],
    'family_name' => $userData['family_name'],
    'picture' => $userData['picture'],
    'locale' => $userData['locale'],
    'login_count' => $dbResult['login_count'],
    'is_admin' => ($dbResult['is_admin'] ?? false)
];

// Rediriger vers l'accueil
header('Location: ../index.php');
exit;
