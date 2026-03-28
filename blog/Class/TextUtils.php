<?php
/**
 * TextUtils.php — Fonctions utilitaires de manipulation texte/HTML / Text/HTML utility functions
 * FR: Regroupe toutes les fonctions de nettoyage, formatage et manipulation de texte et HTML
 * EN: Consolidates all text and HTML cleaning, formatting and manipulation functions
 */

// ======================================================
// Nettoyage HTML
// ======================================================

/**
 * Supprime toutes les balises HTML d'une chaine.
 */
function removeHtmlTags($input) {
    return strip_tags($input);
}

/**
 * Nettoie le HTML pour ne garder que le texte brut.
 */
function cleanHtmlToPlainText($html) {
    $text = strip_tags($html);
    $text = trim($text);
    $text = preg_replace('/\s+/u', ' ', $text);
    return $text;
}

/**
 * Nettoie le HTML en supprimant styles et attributs non essentiels (garde href et title sur les liens).
 */
function cleanHTML($html) {
    $doc = new DOMDocument();
    libxml_use_internal_errors(true);
    $doc->loadHTML('<?xml encoding="utf-8" ?>' . $html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);

    $xpath = new DOMXPath($doc);

    foreach ($xpath->query('//*[@style]') as $node) {
        if ($node instanceof DOMElement) {
            $node->removeAttribute('style');
        }
    }

    foreach ($doc->getElementsByTagName('*') as $node) {
        if ($node instanceof DOMElement) {
            $allowedAttrs = [];
            if ($node->nodeName === 'a') {
                $allowedAttrs = ['href', 'title'];
            }
            $attrs = [];
            foreach ($node->attributes as $attr) {
                $attrs[] = $attr->nodeName;
            }
            foreach ($attrs as $attrName) {
                if (!in_array($attrName, $allowedAttrs)) {
                    $node->removeAttribute($attrName);
                }
            }
        }
    }

    return $doc->saveHTML();
}

// ======================================================
// Limitation et extraction de texte
// ======================================================

/**
 * Tronque un texte a un nombre maximum de mots.
 */
function limiterMots($texte, $limite = 400) {
    $mots = preg_split('/\s+/', trim($texte));
    if (count($mots) > $limite) {
        $mots = array_slice($mots, 0, $limite);
        $texte = implode(' ', $mots) . '...';
    }
    return $texte;
}

/**
 * Extrait uniquement les lettres alphabetiques.
 */
function extraireAlphabetique($str) {
    return preg_replace('/[^a-zA-Z]/', '', $str);
}

// ======================================================
// Conversion BR / Paragraphes / Liens
// ======================================================

/**
 * Transforme du texte avec balises BR en paragraphes HTML avec liens cliquables.
 */
function brToHtmlParagraphs(string $raw): string {
    $tmp = preg_replace('/<br\s*\/?>/i', "\n", $raw);
    $tmp = preg_replace("/\r\n|\r/", "\n", $tmp);
    $tmp = preg_replace("/\n{2,}/", "\n\n", $tmp);

    $parts = preg_split("/\n\s*\n/", trim($tmp));

    $linkified = function($s) {
        return preg_replace(
            '#(https?://[^\s<]+)#i',
            '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>',
            $s
        );
    };

    $htmlParts = array_map(function($p) use ($linkified) {
        $p = trim($p);
        $p = htmlspecialchars($p, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $p = nl2br($p);
        $p = $linkified($p);
        return "<p>$p</p>";
    }, $parts);

    return implode("\n", $htmlParts);
}

// ======================================================
// HTML vers texte brut ASCII + premier caractere
// ======================================================

/**
 * Convertit HTML en texte brut ASCII.
 */
function html_vers_texte_brut($html) {
    $texte = strip_tags($html);
    $texte = html_entity_decode($texte, ENT_QUOTES | ENT_HTML5, 'UTF-8');

    $resultat = '';
    $longueur = strlen($texte);
    $premier_trouve = false;

    for ($i = 0; $i < $longueur; $i++) {
        $caractere = $texte[$i];
        if (ctype_print($caractere) && $caractere !== ' ' && $caractere !== "\t" && $caractere !== "\n" && $caractere !== "\r") {
            $premier_trouve = true;
        }
        if ($premier_trouve) {
            if ($caractere >= ' ' && $caractere <= '~') {
                $resultat .= $caractere;
            } else if ($caractere === "\n" || $caractere === "\r" || $caractere === "\t") {
                $resultat .= ' ';
            }
        }
    }

    $resultat = preg_replace('/\s+/', ' ', $resultat);
    $resultat = trim($resultat);
    return $resultat;
}

/**
 * Ajoute une balise autour du premier caractere de texte dans du HTML.
 */
function html_premier_caractere($html, $balise, $nom_classe) {
    $resultat = preg_replace_callback(
        '/>(.)/',
        function($matches) use ($balise, $nom_classe) {
            static $premier_trouve = false;
            if (!$premier_trouve && trim($matches[1]) !== '') {
                $premier_trouve = true;
                return '><' . $balise . ' class="' . $nom_classe . '">' . $matches[1] . '</' . $balise . '>';
            }
            return $matches[0];
        },
        $html,
        1
    );
    return $resultat;
}

// ======================================================
// Ajout de classe au premier caractere d'un element cible
// ======================================================

/**
 * Ajoute une classe au premier caractere d'un element cible par attribut.
 */
function addClassToFirstChar($html, string $attribute, string $value, string $firstClass, int $position = 0) {
    if (empty($html)) {
        return $html;
    }

    $html = str_replace('&nbsp;', ' ', $html);

    $doc = new DOMDocument();
    libxml_use_internal_errors(true);
    @$doc->loadHTML(mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8'), LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
    libxml_clear_errors();

    removeNodesByTagName($doc, 'script');
    removeNodesByTagName($doc, 'style');

    $elements = getElementsByAttribute($doc, $attribute, $value);

    if (!empty($elements) && isset($elements[$position])) {
        $target = $elements[$position];
        $firstTextNode = findFirstTextNode($target);

        if ($firstTextNode && trim($firstTextNode->textContent) !== '') {
            $text = $firstTextNode->textContent;
            $firstChar = mb_substr($text, 0, 1);
            $rest = mb_substr($text, 1);

            $span = $doc->createElement('span');
            $span->setAttribute('class', $firstClass);
            $span->appendChild($doc->createTextNode($firstChar));

            $fragment = $doc->createDocumentFragment();
            $fragment->appendChild($span);
            if ($rest !== '') {
                $fragment->appendChild($doc->createTextNode($rest));
            }

            if ($firstTextNode->parentNode) {
                $firstTextNode->parentNode->replaceChild($fragment, $firstTextNode);
            }
        }
    }

    return $doc->saveHTML();
}

function removeNodesByTagName($doc, $tagName) {
    $nodes = $doc->getElementsByTagName($tagName);
    $toRemove = [];
    foreach ($nodes as $node) {
        $toRemove[] = $node;
    }
    foreach ($toRemove as $node) {
        if ($node->parentNode) {
            $node->parentNode->removeChild($node);
        }
    }
}

function getElementsByAttribute($doc, $attribute, $value) {
    $elements = [];
    $xpath = new DOMXPath($doc);

    if ($attribute === 'tag') {
        $nodes = $doc->getElementsByTagName($value);
        foreach ($nodes as $node) {
            $elements[] = $node;
        }
        return $elements;
    }

    if ($attribute === 'id') {
        $el = $doc->getElementById($value);
        if ($el) {
            $elements[] = $el;
        }
        return $elements;
    }

    if ($attribute === 'class') {
        $nodes = $xpath->query("//*[contains(concat(' ', normalize-space(@class), ' '), ' $value ')]");
        foreach ($nodes as $node) {
            $elements[] = $node;
        }
        return $elements;
    }

    $nodes = $xpath->query("//*[@{$attribute}='{$value}']");
    foreach ($nodes as $node) {
        $elements[] = $node;
    }

    return $elements;
}

function findFirstTextNode($node) {
    if (!$node || !$node->childNodes) {
        return null;
    }

    foreach ($node->childNodes as $child) {
        if ($child instanceof DOMText && trim($child->textContent) !== '') {
            return $child;
        }
        if ($child instanceof DOMElement) {
            if (in_array($child->tagName, ['script', 'style', 'img'])) {
                continue;
            }
            $result = findFirstTextNode($child);
            if ($result !== null) {
                return $result;
            }
        }
    }
    return null;
}

// ======================================================
// Remplacement d'entites HTML
// ======================================================

function replace_element_1($element) {
    // FR: Decode toutes les entites HTML
    $element = html_entity_decode($element, ENT_QUOTES | ENT_HTML5, 'UTF-8');

    // FR: Nettoie les <br> et <div> du contenteditable a l'interieur des <script>
    // EN: Clean contenteditable <br> and <div> artifacts inside <script> blocks
    $element = preg_replace_callback('/<script\b([^>]*)>(.*?)<\/script>/is', function($m) {
        $attrs = $m[1];
        $code = $m[2];
        $code = preg_replace('/<br\s*\/?>/i', "\n", $code);
        $code = preg_replace('/<\/div>\s*<div[^>]*>/i', "\n", $code);
        $code = preg_replace('/<\/?div[^>]*>/i', "\n", $code);
        $code = preg_replace('/\n{3,}/', "\n\n", $code);
        return '<script' . $attrs . '>' . $code . '</script>';
    }, $element);

    return $element;
}

/**
 * Version securisee de replace_element_1 pour les visiteurs.
 * Decode les entites HTML mais supprime les scripts et attributs dangereux.
 * Garde les iframes (YouTube, etc.), video, audio, img et le HTML standard.
 */
function replace_element_safe($element) {
    // FR: Decode toutes les entites HTML
    $element = html_entity_decode($element, ENT_QUOTES | ENT_HTML5, 'UTF-8');

    // FR: Supprime les balises script et leur contenu
    $element = preg_replace('/<script\b[^>]*>.*?<\/script>/is', '', $element);

    // FR: Supprime les attributs evenementiels JS (onclick, onerror, onload, etc.)
    $element = preg_replace('/\s+on\w+\s*=\s*["\'][^"\']*["\']/i', '', $element);
    $element = preg_replace('/\s+on\w+\s*=\s*\S+/i', '', $element);

    // FR: Supprime les liens javascript:
    $element = preg_replace('/href\s*=\s*["\']javascript:[^"\']*["\']/i', 'href="#"', $element);

    return $element;
}

function replace_element_2($element) {
    $element = str_replace("&lt;", "<", removeHtmlTags($element));
    $element = str_replace("&gt;", ">", $element);
    $element = str_replace("&nbsp;", "", $element);
    return $element;
}

function replace_element_3($element) {
    $element = str_replace("&lt;", "<", AsciiConverter::asciiToString($element));
    $element = str_replace("&gt;", ">", $element);
    $element = str_replace("&nbsp;", "", $element);
    return $element;
}

function replace_element_4($element) {
    $element = str_replace("&lt;", "<", removeHtmlTags(AsciiConverter::asciiToString($element)));
    $element = str_replace("&gt;", ">", $element);
    $element = str_replace("&nbsp;", "", $element);
    return $element;
}

?>
