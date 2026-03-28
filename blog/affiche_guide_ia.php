<?php
$path = __DIR__ . '/guide-ia.md';
$content = file_get_contents($path);
echo nl2br(htmlspecialchars($content));
?>