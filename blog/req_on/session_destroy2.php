<?php
/**
 * session_destroy2.php — Destruction de session avec redirection / Session destruction with redirect
 * FR: Detruit la session et redirige vers la page precedente
 * EN: Destroys session and redirects to previous page
 */
session_start() ;
session_destroy();
?>
<?php
if (!empty($_SERVER['HTTP_REFERER'])) {
    header('Location: ' . $_SERVER['HTTP_REFERER']);
    exit;
} else {
    // FR: Fallback si la page precedente est inconnue / EN: Fallback if previous page is unknown
    header('Location: index.php');
    exit;
}
?>



