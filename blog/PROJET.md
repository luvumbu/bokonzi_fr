# BOKONZI CMS - Documentation du Projet

> CMS PHP complet pour la gestion de projets avec support multilingue (FR/EN), gestion de fichiers, authentification utilisateur et architecture basée sur une base de données MySQL.

---

## Structure du Projet

```
/htdocs/
├── index.php                      # Point d'entrée principal (routeur)
├── web.php                        # Page vitrine agence web BOKONZI
├── recherche.php                  # Moteur de recherche de fichiers (Pro V4)
├── css.css                        # Feuille de style globale
├── .htaccess                      # Réécriture d'URL Apache
├── php.ini                        # Configuration PHP (upload 2GB, timeout 3600s)
├── og-image.png                   # Image Open Graph
│
├── Class/                         # Classes PHP utilitaires (52 fichiers)
├── index/                         # Authentification & menu principal
├── projet/                        # Module de gestion de projets
├── req_on/                        # Handlers de requêtes (connecté)
├── req_off/                       # Handlers de requêtes (déconnecté)
├── file_dowload/                  # Upload & gestion d'images
├── info_exe/                      # Scripts d'information & exécution
├── lang/                          # Fichiers de traduction (fr, en)
├── template/                      # Structures de templates
├── script_ffa_front_back2/        # Application sportive FFA
└── test/                          # Répertoire de tests
```

---

## Fichiers Principaux

### `index.php` - Routeur Principal

Point d'entrée de toute l'application. Route les requêtes via un `switch` basé sur les paramètres URL :
- Route par défaut → `index/default.php` (login/dashboard)
- Routes projets → `projet/index.php`
- Gestion des sessions utilisateur

### `web.php` - Page Vitrine

Page marketing publique de l'agence web BOKONZI :
- Design responsive (mobile-friendly)
- Navigation fixe avec sélecteur de langue
- Cartes de services : Web Engineering, Sport Data, Game Development, Modélisation 3D
- Effets glassmorphism en CSS

### `recherche.php` - Moteur de Recherche de Fichiers (Pro V4)

Outil d'analyse de fichiers :
- Parcours récursif des répertoires
- Recherche par mot-clé avec surlignage des lignes
- Affichage des métadonnées (taille, permissions, dates)
- Deux modes : afficher tous les fichiers ou seulement les correspondances
- Allocation mémoire de 900MB

### `.htaccess` - Réécriture d'URL

- Active `mod_rewrite` Apache
- Réécrit toutes les requêtes vers `index.php?url=[request_uri]`
- Préserve les fichiers et répertoires existants
- Exclut `/test/index.php`

### `php.ini` - Configuration PHP

| Paramètre | Valeur |
|---|---|
| Upload max | 2 GB |
| POST max | 2 GB |
| Timeout | 3600 s (1h) |
| Mémoire | 3 GB |

---

## Classes (`/Class/` - 52 fichiers)

### Base de Données

| Fichier | Rôle |
|---|---|
| `DatabaseHandler.php` | ORM MySQL complet (~1400 lignes) : CRUD, création de tables, clés étrangères, jointures |

### HTML & Formulaires

| Fichier | Rôle |
|---|---|
| `Element_.php` | Classe élément HTML générique (tag, attributs, texte, rendu) |
| `Group_.php` | Regroupe plusieurs éléments HTML |
| `GroupManager_.php` | Gère les groupes, génère HTML + JavaScript |
| `Creat_form.php` | Utilitaires de création de formulaires |
| `Div_page.php` | Structures de division de pages |

### Gestion de Fichiers & Images

| Fichier | Rôle |
|---|---|
| `ImageResizer.php` | Redimensionnement d'images |
| `Upload.js` | Handler JavaScript d'upload |
| `getFilesFromDir.php` | Listage de fichiers d'un répertoire |
| `getFileExtension.php` | Détection d'extension de fichier |
| `CheckFileExists.php` | Vérification d'existence de fichier |
| `fichierExiste.php` | Variante française de vérification |

### Texte & Encodage

| Fichier | Rôle |
|---|---|
| `AsciiConverter.php` | Conversion ASCII (PHP) |
| `ASciiConverter.js` | Conversion ASCII (JavaScript) |
| `removeHtmlTags.php` | Suppression du HTML |
| `cleanHTML.php` | Nettoyage HTML |
| `cleanHtmlToPlainText.php` | HTML vers texte brut |
| `brToHtmlParagraphs.php` | Conversion `<br>` en `<p>` |
| `limiterMots.php` | Limitation du nombre de mots |
| `removeHtmlTags_asciiToString.php` | Suppression HTML + conversion ASCII |

### Validation & Sécurité

| Fichier | Rôle |
|---|---|
| `EmailValidator.php` | Validation d'email |
| `CSSValidator.php` | Validation CSS |

### Internationalisation

| Fichier | Rôle |
|---|---|
| `Language.php` | Gestion i18n (FR/EN) |
| `LanguageSwitcher.php` | Composant de changement de langue |

### Utilitaires

| Fichier | Rôle |
|---|---|
| `FrenchClock.php` | Formatage date/heure français |
| `formatDateFr.php` | Formatage de date française |
| `formatMailTextToHtml.php` | Conversion texte email → HTML |
| `EnsureDirectoryExists.php` | Création de répertoires si manquants |
| `creerDossierSiExistePas.php` | Variante française |
| `IsLocal.php` | Détection environnement local |
| `Path_config.php` | Configuration des chemins |
| `Give_url.php` | Génération d'URLs |
| `Js.php` | Intégration JavaScript |
| `SpeechCard.php` | Gestion des cartes speech |
| `SpeechController.php` | Contrôleur speech |
| `traitement.php` | Traitement de données |
| `session_destroy.php` | Destruction de session |
| `Data_send_class.php` | Transmission de données |

---

## Authentification & Menu (`/index/`)

### Fichiers principaux

| Fichier | Rôle |
|---|---|
| `require_once.php` | Bootstrap : charge Language, Element, Group, GroupManager, DatabaseHandler |
| `default.php` | Routeur principal : config BDD existante → login, sinon → formulaire création BDD |
| `login.php` | Formulaire de connexion (nom BDD, table, utilisateur) |
| `login_js.php` | JavaScript du formulaire login |
| `creation_formulaire_bdd.php` | Formulaire de configuration initiale de la BDD |
| `effacement.php` | Nettoyage session utilisateurs déconnectés |
| `on.php` | Routeur pour utilisateurs connectés |

### Sous-répertoire `on/` - Vues connectées

| Fichier | Rôle |
|---|---|
| `menu_principal.php` | Menu de navigation principal (thème Simpson) |
| `all_projet.php` | Affichage de tous les projets utilisateur |
| `all_projet_sql.php` | Requêtes SQL des projets |
| `all_projet_sql_child.php` | Requêtes SQL des sous-projets |

---

## Gestion de Projets (`/projet/`)

| Fichier | Rôle |
|---|---|
| `index.php` | Page principale projet : charge données, affiche menu, détails projet |
| `require_once.php` | Bootstrap du module projet |
| `index_form.php` | Gestion des formulaires projet |
| `index_html.php` | Affichage HTML du projet |
| `index_child.php` | Gestion des sous-projets |
| `index_formulaire_projet.php` | Structure du formulaire projet |
| `index_on_online.php` | Affichage projet en ligne |
| `index_off.php` | Version hors ligne |
| `index_off_1.php` | Version hors ligne (variante) |
| `index_off_req.php` | Requêtes hors ligne |
| `css_projet.css` | Style des pages projet |
| `css_projet_child.css` | Style des sous-projets |

---

## Handlers de Requêtes

### `/req_on/` - Requêtes Authentifiées (12 fichiers)

| Fichier | Rôle |
|---|---|
| `login_bdd.php` | Vérification login BDD |
| `insert_projet.php` | Création de projet |
| `insert_file.php` | Upload de fichiers |
| `update_projet.php` | Mise à jour de projet |
| `update_front.php` | Mise à jour frontend |
| `update_img_projet.php` | Mise à jour image projet |
| `id_projet_img_auto.php` | Attribution auto d'ID image |
| `img_projet_src_img.php` | Sourcing image projet |
| `info_index.php` | Informations index |
| `set_lang.php` | Définition de la langue |
| `session_destroy.php` | Destruction de session |
| `session_destroy2.php` | Destruction de session (variante) |

### `/req_off/` - Requêtes Non-Authentifiées (3 fichiers)

| Fichier | Rôle |
|---|---|
| `dbCheck_bdd.php` | Vérification/validation de la connexion BDD |

---

## Gestion de Fichiers (`/file_dowload/`)

| Fichier | Rôle |
|---|---|
| `img.php` | Gestion d'images (~9000 lignes) |
| `upload_chunk.php` | Upload par morceaux (chunked) |
| `generatedFileName.php` | Génération de noms de fichiers |
| `uploads/` | Répertoire des fichiers uploadés |

---

## Information & Exécution (`/info_exe/`)

| Fichier | Rôle |
|---|---|
| `dbCheck.php` | Fichier de configuration BDD (dbname, username, password) |
| `effacement.php` | Nettoyage session/utilisateur |
| `remove_projet.php` | Suppression de projet |
| `session_destroy.php` | Destruction de session |
| `unlink_off.php` | Suppression de fichiers hors ligne |

---

## Traductions (`/lang/`)

| Fichier | Rôle |
|---|---|
| `fr.php` | Traductions françaises (~150+ clés) |
| `en.php` | Traductions anglaises |

Couvre : labels de navigation, labels de formulaires, textes de boutons, titres de cartes, interface de recherche.

---

## Application Sportive FFA (`/script_ffa_front_back2/`)

Application complète de gestion sportive (Fédération Française d'Athlétisme) avec son propre système de login.

```
script_ffa_front_back2/
├── index.php          # Point d'entrée
├── blog.php           # Fonctionnalité blog
├── projet.php         # Gestion de projets
├── vlog.php           # Blog vidéo
├── js.js              # JavaScript principal
├── projet.css         # Style projets
├── style.css          # Style global
├── readme             # Documentation
│
├── login/             # Système d'authentification
│   ├── class/         # Classes spécifiques au login
│   │   └── js/        # JavaScript (add, array_info, off)
│   ├── pages_on/      # Pages authentifiées
│   ├── pages_off/     # Pages publiques
│   ├── apparence/     # Apparence UI
│   └── css.css        # Style login
│
├── model/             # Modèles de données + CSS
├── view/              # Templates de vues
├── json/              # Configs (header.json, footer.json, section.json)
├── src/               # Sources (CSS, configuration)
└── exe/               # Traitement de formulaires
```

---

## Templates (`/template/`)

| Répertoire | Rôle |
|---|---|
| `creation1/` | Jeu de templates 1 |
| `creation2/` | Jeu de templates 2 |

---

## Patterns Architecturaux

1. **Structure MVC-like** : Séparation classes (modèles), pages (vues), handlers de requêtes (contrôleurs)
2. **Génération HTML par objets** : Classes `Element` et `Group` pour la génération dynamique de formulaires/pages
3. **Abstraction BDD** : `DatabaseHandler` fournit des opérations MySQL unifiées
4. **Support Multilingue** : Classe `Language` gère les traductions FR/EN
5. **Authentification par Session** : Statut utilisateur stocké dans `$_SESSION["info_index"]`
6. **Réécriture d'URL** : URLs propres via `.htaccess` routant tout vers `index.php?url=...`
7. **Organisation Modulaire** : Répertoires séparés par responsabilité (auth, projets, requêtes, etc.)

---

## Workflows Principaux

1. **Visite du site** : `web.php` (page marketing) OU `index.php` (application)
2. **Premier lancement** : Formulaire login → Configuration BDD → Création de projet
3. **Utilisateur connecté** : Menu → Créer/Éditer projets → Uploader images → Gérer contenu
4. **Gestion de projet** : Créer → Ajouter sous-projets → Mettre à jour → Supprimer
5. **Recherche de fichiers** : `recherche.php` pour rechercher dans le code avec surlignage

---

## Statistiques

| Type | Nombre |
|---|---|
| Fichiers PHP | ~231 |
| Fichiers JavaScript | ~44 |
| Fichiers CSS | ~23 |
| **Total fichiers source** | **~298** |

---

## Thème Visuel

- **Menu principal** : Thème Simpson (fond jaune `#FED90F`, bordures rouges `#D6282B`, police Comic Sans MS)
- **Page vitrine** : Effets glassmorphism modernes
- **Design responsive** : Adapté mobile
