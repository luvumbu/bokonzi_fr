<?php
/**
 * ThemeSwitcher.php — Selecteur de theme / Theme switcher
 * FR: Composant UI pour basculer entre les themes visuels
 * EN: UI component to switch between visual themes
 *
 * AUTO-DETECTION: Deposer un fichier .css dans themes/ avec les commentaires :
 *   /* @icon: 🎨 * /
 *   /* @label: Mon Theme * /
 *   body.theme-montheme { ... }
 * Et c'est tout ! Le theme apparait automatiquement dans le selecteur.
 */

class ThemeSwitcher {

    public static $defaultTheme = 'simpson';
    private static $cacheFile = null;
    private static $themesCache = null;

    /**
     * FR: Chemin du fichier cache pour le theme actif
     * EN: Cache file path for active theme
     */
    private static function getCacheFile() {
        if (self::$cacheFile === null) {
            self::$cacheFile = __DIR__ . '/../cache/theme.cache';
        }
        return self::$cacheFile;
    }

    /**
     * FR: Scanne le dossier themes/ et parse les metadonnees de chaque .css
     * EN: Scans themes/ directory and parses metadata from each .css file
     *
     * @return array ['theme_id' => ['icon' => '🍩', 'label' => 'Les Simpson'], ...]
     */
    public static function scanThemes() {
        if (self::$themesCache !== null) {
            return self::$themesCache;
        }

        self::$themesCache = [];
        $dir = __DIR__ . '/../themes/';

        foreach (glob($dir . '*.css') as $file) {
            $content = file_get_contents($file);

            // Detecte l'ID depuis body.theme-xxx dans le CSS
            if (!preg_match('/body\.theme-([\w-]+)\s*\{/', $content, $idMatch)) {
                continue; // Pas de body.theme-xxx = fichier ignore
            }
            $id = $idMatch[1];

            $icon = '';
            $label = ucfirst(str_replace(['-', '_'], ' ', $id));

            if (preg_match('/\/\*\s*@icon:\s*(.+?)\s*\*\//', $content, $m)) {
                $icon = trim($m[1]);
            }
            if (preg_match('/\/\*\s*@label:\s*(.+?)\s*\*\//', $content, $m)) {
                $label = trim($m[1]);
            }

            self::$themesCache[$id] = [
                'icon'  => $icon,
                'label' => $label,
            ];
        }

        return self::$themesCache;
    }

    /**
     * FR: Initialise (rien a faire, tout est auto)
     * EN: Initialize (nothing needed, everything is auto)
     */
    public static function init() {
        // Auto-detection, pas besoin d'initialisation
    }

    /**
     * FR: Retourne le theme courant (lu depuis le cache)
     * EN: Returns the current theme (read from cache)
     */
    public static function getTheme() {
        $themes = self::scanThemes();
        $file = self::getCacheFile();

        if (file_exists($file)) {
            $theme = trim(file_get_contents($file));
            if (array_key_exists($theme, $themes)) {
                return $theme;
            }
        }
        return self::$defaultTheme;
    }

    /**
     * FR: Sauvegarde le theme dans le cache fichier
     * EN: Save theme to file cache
     */
    public static function setTheme($theme) {
        $themes = self::scanThemes();
        if (array_key_exists($theme, $themes)) {
            $dir = dirname(self::getCacheFile());
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }
            file_put_contents(self::getCacheFile(), $theme);
        }
    }

    /**
     * FR: Retourne la classe CSS pour le body
     * EN: Returns the CSS class for the body tag
     */
    public static function getBodyClass() {
        return 'theme-' . self::getTheme();
    }

    /**
     * FR: Retourne la liste des IDs de themes disponibles
     * EN: Returns the list of available theme IDs
     */
    public static function getThemes() {
        return array_keys(self::scanThemes());
    }

    /**
     * FR: Affiche le selecteur de theme
     * EN: Display the theme switcher
     */
    public static function render() {
        $currentTheme = self::getTheme();
        $basePath = self::getBasePath();
        $themes = self::scanThemes();

        $html = '
        <div class="theme-switcher">
            <select id="theme-select" onchange="setTheme(this.value)">';

        foreach ($themes as $id => $info) {
            $selected = ($id === $currentTheme) ? 'selected' : '';
            $html .= '<option value="' . $id . '" ' . $selected . '>'
                    . $info['icon'] . ' ' . $info['label']
                    . '</option>';
        }

        $html .= '
            </select>
        </div>
        <script>
            function setTheme(theme) {
                var xhr = new XMLHttpRequest();
                xhr.open("POST", "' . $basePath . 'req_on/set_theme.php", true);
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                xhr.onload = function() {
                    if (xhr.status === 200) {
                        document.body.className = document.body.className.replace(/theme-\w+/g, "") + " theme-" + theme;
                        document.body.className = document.body.className.trim();
                    }
                };
                xhr.send("theme=" + theme);
            }
        </script>';

        return $html;
    }

    /**
     * FR: Determine le chemin de base vers la racine du site
     * EN: Determine the base path to site root
     */
    private static function getBasePath() {
        // Chemin absolu vers la racine de l'app (depuis DOCUMENT_ROOT)
        $appRoot = str_replace('\\', '/', dirname(__DIR__));
        $docRoot = str_replace('\\', '/', $_SERVER['DOCUMENT_ROOT']);
        return str_replace($docRoot, '', $appRoot) . '/';
    }
}
?>
