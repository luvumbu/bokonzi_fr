<?php
// Deconnexion — detruit la session et redirige vers login
// Depend de : config.php
// Utilise par : pages/dashboard.php (bouton "Se deconnecter")
// Redirige vers : auth/login.php
//
// +------------------+-------------------------+
// | Action           | Detail                  |
// +------------------+-------------------------+
// | session_destroy  | Supprime toute la session|
// | Redirection      | → login.php             |
// +------------------+-------------------------+
require_once __DIR__ . '/../config.php';

session_destroy();
header('Location: login.php');
exit;
