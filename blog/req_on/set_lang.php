<?php
/**
 * set_lang.php — Endpoint AJAX pour changer la langue / AJAX endpoint to change language
 * FR: Recoit la langue choisie et la stocke en session
 * EN: Receives the chosen language and stores it in session
 */

session_start();

if (isset($_POST['lang']) && in_array($_POST['lang'], ['fr', 'en'])) {
    $_SESSION['lang'] = $_POST['lang'];
    echo json_encode(['success' => true, 'lang' => $_POST['lang']]);
} else {
    http_response_code(400);
    echo json_encode(['success' => false]);
}
