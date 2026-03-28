<?php
/**
 * set_theme.php — Sauvegarde du theme / Save theme preference
 * FR: Endpoint AJAX pour sauvegarder le theme dans le cache fichier
 * EN: AJAX endpoint to save the chosen theme in file cache
 */
require_once __DIR__ . "/../Class/ThemeSwitcher.php";

$theme = $_POST['theme'] ?? '';

if ($theme && in_array($theme, ThemeSwitcher::getThemes())) {
    ThemeSwitcher::setTheme($theme);
    echo json_encode(['success' => true, 'theme' => $theme]);
} else {
    http_response_code(400);
    echo json_encode(['success' => false]);
}
?>
