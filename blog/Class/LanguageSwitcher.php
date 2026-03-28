<?php
/**
 * LanguageSwitcher.php — Selecteur de langue / Language switcher
 * FR: Composant UI pour basculer entre francais et anglais
 * EN: UI component to switch between French and English
 */

class LanguageSwitcher {

    /**
     * FR: Affiche le selecteur de langue FR | EN
     * EN: Display the language switcher FR | EN
     *
     * @return string HTML du selecteur / Switcher HTML
     */
    public static function render() {
        $currentLang = Language::getLang();
        $frActive = ($currentLang === 'fr') ? 'lang-active' : '';
        $enActive = ($currentLang === 'en') ? 'lang-active' : '';

        return '
        <div class="lang-switcher">
            <span class="lang-option ' . $frActive . '" onclick="setLang(\'fr\')" title="Français">FR</span>
            <span class="lang-separator">|</span>
            <span class="lang-option ' . $enActive . '" onclick="setLang(\'en\')" title="English">EN</span>
        </div>
        <script>
            function setLang(lang) {
                var xhr = new XMLHttpRequest();
                xhr.open("POST", "' . self::getBasePath() . 'req_on/set_lang.php", true);
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                xhr.onload = function() {
                    location.reload();
                };
                xhr.send("lang=" + lang);
            }
        </script>';
    }

    /**
     * FR: Determine le chemin de base vers la racine du site
     * EN: Determine the base path to site root
     */
    private static function getBasePath() {
        $appRoot = str_replace('\\', '/', dirname(__DIR__));
        $docRoot = str_replace('\\', '/', $_SERVER['DOCUMENT_ROOT']);
        return str_replace($docRoot, '', $appRoot) . '/';
    }
}
