<?php
// Tableau de bord — page connectee (menu + profil + projets + admin)
// Depend de : config.php, sql/projets_sql.php, css/dashboard.css
// Utilise par : index.php (redirection si connecte)
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../sql/projets_sql.php';

// Proteger la page : rediriger si pas connecte
if (!isset($_SESSION['user'])) {
    header('Location: ../auth/login.php');
    exit;
}

$user = $_SESSION['user'];
// Lire is_admin directement depuis la BDD (pas la session)
$stmtAdmin = $conn->prepare("SELECT is_admin FROM users WHERE id = ?");
$stmtAdmin->bind_param('i', $user['id']);
$stmtAdmin->execute();
$adminRow = $stmtAdmin->get_result()->fetch_assoc();
$isAdmin = !empty($adminRow['is_admin']);
$isSuperAdmin = ($user['email'] === 'admin@local');
// Mettre a jour la session
$_SESSION['user']['is_admin'] = $isAdmin;

// Synchroniser les dossiers avec la BDD
$projetsDir = __DIR__ . '/../projet';
syncProjets($conn, $projetsDir);

// Charger les permissions avant le traitement des actions
$perms = getPermissions($conn);

// Traiter les actions POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $flash = '';

    // Toggle visibilite : permission + (admin OU proprietaire)
    if (isset($_POST['toggle_visible'])) {
        $id = (int)$_POST['projet_id'];
        $visible = (int)$_POST['visible'];
        if (canDo($perms, 'toggle_visible', $isAdmin) && ($isAdmin || isProjetOwner($conn, $id, $user['id']))) {
            toggleVisibilite($conn, $id, $visible);
            $flash = 'Visibilite modifiee';
        } else {
            $flash = 'ERR:toggle_visible bloque (isAdmin=' . (int)$isAdmin . ')';
        }
    }

    // Actions admin uniquement
    if ($isAdmin) {
        if (isset($_POST['save_permissions'])) {
            updatePermissions($conn, $_POST);
            $perms = getPermissions($conn);
            $flash = 'Permissions enregistrees';
        }
        if (isset($_POST['set_auteur'])) {
            $id = (int)$_POST['projet_id'];
            $uid = (int)$_POST['auteur_id'];
            if ($uid > 0) {
                setAuteur($conn, $id, $uid);
                $flash = 'Auteur attribue (projet=' . $id . ', user=' . $uid . ')';
            } else {
                $flash = 'ERR:set_auteur uid=0 (aucun auteur selectionne)';
            }
        }
        if (isset($_POST['toggle_admin']) && $isSuperAdmin) {
            $uid = (int)$_POST['user_id'];
            $makeAdmin = (int)$_POST['make_admin'];
            if ($uid !== $user['id']) {
                setAdmin($conn, $uid, $makeAdmin);
                $flash = 'Admin modifie';
            }
        }
    } elseif (isset($_POST['set_auteur']) || isset($_POST['save_permissions']) || isset($_POST['toggle_admin'])) {
        $flash = 'ERR:action admin refusee (isAdmin=' . (int)$isAdmin . ', email=' . $user['email'] . ')';
    }

    if ($flash) {
        $_SESSION['flash'] = $flash;
    }

    // Creation d'un nouveau projet (tout utilisateur connecte)
    if (isset($_POST['create_projet']) && canDo($perms, 'create_projet', $isAdmin) && canDo($perms, 'edit_file', $isAdmin)) {
        $nom = trim($_POST['projet_nom'] ?? '');
        if ($nom !== '') {
            createProjet($conn, $projetsDir, $nom, $user['id']);
        }
    }

    // Creation d'un fichier
    if (isset($_POST['create_file']) && canDo($perms, 'create_file', $isAdmin)) {
        $id = (int)$_POST['projet_id'];
        $fileName = trim($_POST['file_name'] ?? '');
        $fileExt = trim($_POST['file_ext'] ?? '');
        if ($id > 0 && $fileName !== '' && $fileExt !== '' && isProjetOwner($conn, $id, $user['id'])) {
            // Nettoyer le nom
            $fileName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $fileName);
            $fileExt = preg_replace('/[^a-zA-Z0-9]/', '', $fileExt);
            $blockedExts = ['exe','bat','cmd','com','msi','dll','so','sh','bin','app','dmg','iso','img','tar','gz','zip','rar','7z'];
            if (!in_array(strtolower($fileExt), $blockedExts) && strlen($fileExt) <= 10) {
                // Trouver le nom du dossier
                $stmt = $conn->prepare("SELECT nom FROM projets WHERE id = ?");
                $stmt->bind_param('i', $id);
                $stmt->execute();
                $row = $stmt->get_result()->fetch_assoc();
                if ($row) {
                    $filePath = $projetsDir . '/' . $row['nom'] . '/' . $fileName . '.' . $fileExt;
                    if (!file_exists($filePath)) {
                        // Contenu par defaut selon l'extension
                        $content = '';
                        switch (strtolower($fileExt)) {
                            case 'html':
                                $content = "<!DOCTYPE html>\n<html lang=\"fr\">\n<head>\n    <meta charset=\"UTF-8\">\n    <title>" . htmlspecialchars($fileName) . "</title>\n</head>\n<body>\n\n</body>\n</html>";
                                break;
                            case 'css':
                                $content = "/* " . $fileName . ".css */\n";
                                break;
                            case 'js':
                                $content = "// " . $fileName . ".js\n";
                                break;
                            case 'php':
                                $content = "<?php\n// " . $fileName . ".php\n";
                                break;
                            case 'json':
                                $content = "{\n\n}";
                                break;
                            default:
                                $content = '';
                        }
                        file_put_contents($filePath, $content);
                    }
                }
            }
        }
    }

    // Suppression d'un fichier
    if (isset($_POST['delete_file']) && canDo($perms, 'delete_file', $isAdmin)) {
        $id = (int)$_POST['projet_id'];
        $file = $_POST['file_path'] ?? '';
        if ($id > 0 && $file !== '' && isProjetOwner($conn, $id, $user['id'])) {
            $stmt = $conn->prepare("SELECT nom FROM projets WHERE id = ?");
            $stmt->bind_param('i', $id);
            $stmt->execute();
            $row = $stmt->get_result()->fetch_assoc();
            if ($row) {
                $fullPath = $projetsDir . '/' . $row['nom'] . '/' . basename($file);
                if (is_file($fullPath)) {
                    unlink($fullPath);
                }
            }
        }
    }

    // Sauvegarde contenu d'un fichier
    if (isset($_POST['save_file']) && canDo($perms, 'edit_file', $isAdmin)) {
        $id = (int)$_POST['projet_id'];
        $file = $_POST['file_path'] ?? '';
        $content = $_POST['file_content'] ?? '';
        if ($id > 0 && $file !== '' && ($isAdmin || isProjetOwner($conn, $id, $user['id']))) {
            $stmt = $conn->prepare("SELECT nom FROM projets WHERE id = ?");
            $stmt->bind_param('i', $id);
            $stmt->execute();
            $row = $stmt->get_result()->fetch_assoc();
            if ($row) {
                $fullPath = $projetsDir . '/' . $row['nom'] . '/' . basename($file);
                // Verifier que le fichier est bien dans le dossier du projet
                if (is_file($fullPath)) {
                    file_put_contents($fullPath, $content);
                }
            }
        }
    }

    // Parametres sprite
    if (isset($_POST['save_sprite'])) {
        $id = (int)$_POST['projet_id'];
        if ($isAdmin || isProjetOwner($conn, $id, $user['id'])) {
            updateSpriteParams($conn, $id, $_POST['sprite_size'] ?? 100, $_POST['sprite_force'] ?? 100, $_POST['sprite_color'] ?? '#6c5ce7', $_POST['sprite_speed'] ?? 100);
        }
    }

    // Modification projet (titre/desc/image)
    if (isset($_POST['update_info']) && canDo($perms, 'edit_info', $isAdmin)) {
        $id = (int)$_POST['projet_id'];
        if ($isAdmin || isProjetOwner($conn, $id, $user['id'])) {
            $titre = trim($_POST['titre'] ?? '');
            $desc = trim($_POST['description'] ?? '');
            $imagePath = null;

            if (!empty($_FILES['image']['name']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
                $allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
                $finfo = finfo_open(FILEINFO_MIME_TYPE);
                $mime = finfo_file($finfo, $_FILES['image']['tmp_name']);
                finfo_close($finfo);

                if (in_array($mime, $allowed)) {
                    $ext = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
                    $filename = 'projet_' . $id . '_' . time() . '.' . $ext;
                    $dest = __DIR__ . '/../uploads/projets/' . $filename;
                    if (move_uploaded_file($_FILES['image']['tmp_name'], $dest)) {
                        $imagePath = 'uploads/projets/' . $filename;
                    }
                }
            }

            updateProjetInfo($conn, $id, $titre, $desc, $imagePath);
        }
    }

    // Rediriger vers le bon onglet
    $tab = '';
    $fromTab = $_POST['from_tab'] ?? '';
    if ($fromTab === 'config') {
        $tab = '?tab=config';
    } elseif ($fromTab === 'bdd') {
        $tab = '?tab=bdd';
    } elseif (isset($_POST['create_file']) || isset($_POST['update_info']) || isset($_POST['toggle_visible']) || isset($_POST['save_file']) || isset($_POST['delete_file']) || isset($_POST['save_sprite'])) {
        $tab = '?tab=mesprojets';
    } elseif (isset($_POST['set_auteur']) || isset($_POST['save_permissions']) || isset($_POST['toggle_admin'])) {
        $tab = '?tab=admin';
    }
    header('Location: dashboard.php' . $tab);
    exit;
}

// Recuperer les donnees
$projets = getProjets($conn, $isAdmin);
$mesProjets = getMesProjets($conn, $user['id']);
$pendants = $isAdmin ? getProjetsPendants($conn) : [];
$allUsers = $isAdmin ? getUsers($conn) : [];
$perms = getPermissions($conn);
$can = function($action) use ($perms, $isAdmin) { return canDo($perms, $action, $isAdmin); };
$hasEditPerms = $isAdmin || $can('edit_info') || $can('edit_file') || $can('create_file') || $can('delete_file') || $can('toggle_visible');
$editProjets = $hasEditPerms ? ($isAdmin ? getProjets($conn, true) : $mesProjets) : [];
$binaryExts = ['png','jpg','jpeg','gif','bmp','ico','webp','mp3','mp4','wav','ogg','avi','mov','mkv','pdf','zip','rar','7z','tar','gz','exe','dll','so','bin','ttf','woff','woff2','eot','otf'];

// Scanner les apps (dossiers a la racine avec un index.php, hors dossiers systeme)
$appsDir = __DIR__ . '/..';
$systemDirs = ['projet','pages','auth','admin','api','sql','css','js','uploads','docs','Class','app','vendor','node_modules','.git','.claude'];
$apps = [];
foreach (scandir($appsDir) as $entry) {
    if ($entry === '.' || $entry === '..') continue;
    if (in_array($entry, $systemDirs)) continue;
    $fullPath = $appsDir . '/' . $entry;
    if (is_dir($fullPath) && file_exists($fullPath . '/index.php')) {
        $apps[] = [
            'nom' => $entry,
            'path' => '../' . $entry . '/',
            'has_readme' => file_exists($fullPath . '/PROJET.md') || file_exists($fullPath . '/README.md'),
            'file_count' => count(glob($fullPath . '/*')),
        ];
    }
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tableau de bord — bokonzifr</title>
    <link rel="icon" type="image/svg+xml" href="../favicon.svg">
    <link rel="stylesheet" href="../css/dashboard.css">
    <link rel="stylesheet" href="../css/kirby.css">
    <script src="../js/kirby.js"></script>
</head>
<body>
    <!-- UNIVERS KIRBY ARRIERE-PLAN -->
    <div class="kirby-world kirby-bg">
        <button class="kirby-toggle-mode" onclick="toggleDayNight(this)"><span>&#9788;</span><span class="mode-label">Jour</span></button>
        <div class="kirby-sidebar">
            <div class="kirby-sidebar-title">Projets</div>
            <?php foreach (getProjets($conn, false) as $sp): ?>
            <a href="../projet/<?= htmlspecialchars($sp['nom']) ?>/" class="kirby-sidebar-item" target="_blank">
                <span class="kirby-sidebar-dot" style="background: <?= htmlspecialchars($sp['sprite_color'] ?? '#6c5ce7') ?>;"></span>
                <span class="kirby-sidebar-name"><?= htmlspecialchars($sp['titre'] ?: $sp['nom']) ?></span>
            </a>
            <?php endforeach; ?>
        </div>
        <div class="kirby-planet"></div>
        <div class="kirby-planet-ring"></div>
        <div class="kirby-stars" id="kirbyStars"></div>
        <div class="kirby-clouds" id="kirbyClouds"></div>
        <div class="kirby-hills">
            <div class="hill hill-1"></div>
            <div class="hill hill-2"></div>
            <div class="hill hill-3"></div>
            <div class="hill hill-4"></div>
        </div>
        <div class="kirby-sky" id="kirbySky"></div>
        <div class="kirby-ground">
            <div class="ground-grass" id="groundGrass"></div>
            <div class="ground-dirt"></div>
        </div>
    </div>

    <div class="dashboard-container">
        <?php if (!empty($_SESSION['flash'])): ?>
        <div style="background:#1e293b;border:1px solid #f59e0b;color:#f59e0b;padding:10px 16px;border-radius:8px;margin-bottom:12px;font-size:14px;">
            <?= htmlspecialchars($_SESSION['flash']) ?>
        </div>
        <?php unset($_SESSION['flash']); endif; ?>
        <div class="dashboard-header">
            <?php if (!empty($user['picture'])): ?>
                <img src="<?= htmlspecialchars($user['picture']) ?>" alt="Avatar" class="avatar" referrerpolicy="no-referrer">
            <?php endif; ?>
            <div>
                <h1>Bienvenue, <?= htmlspecialchars($user['given_name'] ?: $user['name']) ?></h1>
                <p class="email"><?= htmlspecialchars($user['email']) ?></p>
                <?php if ($isAdmin): ?>
                    <span class="badge-admin">Admin</span>
                <?php endif; ?>
            </div>
        </div>

        <?php if ($isAdmin && !empty($pendants)): ?>
        <div class="alert-pendants">
            <span class="alert-icon">&#9888;</span>
            <span><?= count($pendants) ?> projet(s) en attente de configuration</span>
        </div>
        <?php endif; ?>

        <nav class="menu">
            <button class="menu-btn active" data-target="section-projets">Projets</button>
            <?php // Bouton "Modifier" retire du menu — acces via le crayon sur chaque projet ?>
            <?php if ($isAdmin): ?>
                <button class="menu-btn" data-target="section-allprojets">Tous les projets</button>
                <?php if (!empty($pendants)): ?>
                    <button class="menu-btn" data-target="section-config">Configurer (<?= count($pendants) ?>)</button>
                <?php endif; ?>
            <?php endif; ?>
            <button class="menu-btn" data-target="section-apps">Apps</button>
            <button class="menu-btn" data-target="section-profil">Profil</button>
            <a href="../index.php" class="menu-btn menu-link">Accueil</a>
            <?php if ($isAdmin): ?>
                <button class="menu-btn" data-target="section-bdd">BDD</button>
                <button class="menu-btn" data-target="section-admin">Admin</button>
            <?php endif; ?>
        </nav>

        <!-- SECTION PROJETS -->
        <section id="section-projets" class="section">
            <div class="card">
                <h2>Mes projets</h2>

                <?php if ($can('create_projet') && $can('edit_file')): ?>
                <!-- Formulaire creation -->
                <form method="POST" class="create-projet-form">
                    <input type="text" name="projet_nom" placeholder="Nom du nouveau projet" required>
                    <button type="submit" name="create_projet" class="btn-action btn-save">Creer</button>
                </form>
                <?php endif; ?>

                <?php if (empty($mesProjets)): ?>
                    <p class="empty-msg">Aucun projet. Creez-en un ci-dessus.</p>
                <?php else: ?>
                    <?php foreach ($mesProjets as $p):
                        $pPath = $projetsDir . '/' . $p['nom'];
                        $pFiles = [];
                        if (is_dir($pPath)) {
                            foreach (scandir($pPath) as $f) {
                                if ($f === '.' || $f === '..') continue;
                                if (is_file($pPath . '/' . $f)) $pFiles[] = $f;
                            }
                        }
                    ?>
                    <div class="projet-block <?= ($p['visible'] == 0) ? 'hidden-projet' : '' ?>">
                        <div class="projet-block-header" onclick="this.parentElement.classList.toggle('open')">
                            <?php if (!empty($p['image'])): ?>
                                <img src="../<?= htmlspecialchars($p['image']) ?>" alt="" class="projet-link-img">
                            <?php else: ?>
                                <span class="projet-icon">&#128194;</span>
                            <?php endif; ?>
                            <span class="projet-nom"><?= htmlspecialchars($p['titre'] ?: $p['nom']) ?></span>
                            <?php if ($p['visible'] == 1): ?>
                                <span class="vis-indicator vis-on" title="Visible">&#128065;</span>
                            <?php else: ?>
                                <span class="vis-indicator vis-off" title="Masque">&#128065;&#8205;&#128488;</span>
                            <?php endif; ?>
                            <?php if (!empty($editProjets)): ?>
                            <button class="btn-edit-projet" onclick="event.stopPropagation(); editProjet(<?= $p['id'] ?>);" title="Modifier">&#9998;</button>
                            <?php endif; ?>
                            <a href="../projet/<?= htmlspecialchars($p['nom']) ?>/" class="btn-open-projet" target="_blank" onclick="event.stopPropagation();">Ouvrir</a>
                            <span class="projet-block-arrow">&#9654;</span>
                        </div>
                        <div class="projet-block-body">
                            <?php if ($can('edit_info')): ?>
                            <!-- Modifier image -->
                            <form method="POST" enctype="multipart/form-data" class="edit-image-inline" onclick="event.stopPropagation();">
                                <input type="hidden" name="projet_id" value="<?= $p['id'] ?>">
                                <input type="hidden" name="titre" value="<?= htmlspecialchars($p['titre'] ?? '') ?>">
                                <input type="hidden" name="description" value="<?= htmlspecialchars($p['description'] ?? '') ?>">
                                <label class="image-dropzone-mini">
                                    <input type="file" name="image" accept="image/*" class="image-input" hidden>
                                    <?php if (!empty($p['image'])): ?>
                                        <img src="../<?= htmlspecialchars($p['image']) ?>" alt="" class="image-preview-mini">
                                        <span class="image-change-label">Changer</span>
                                    <?php else: ?>
                                        <span class="image-add-label">+ Photo</span>
                                    <?php endif; ?>
                                </label>
                                <noscript><button type="submit" name="update_info" class="btn-action btn-save">OK</button></noscript>
                            </form>
                            <?php endif; ?>
                            <?php if (!empty($pFiles)): ?>
                                <?php foreach ($pFiles as $f):
                                    $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
                                    $isBin = in_array($ext, $binaryExts);
                                    $fContent = $isBin ? '' : file_get_contents($pPath . '/' . $f);
                                ?>
                                <div class="file-editor-item">
                                    <div class="file-editor-header" onclick="<?= (!$isBin && $can('edit_file')) ? "this.parentElement.classList.toggle('open')" : '' ?>">
                                        <span class="file-ext-badge">.<?= htmlspecialchars($ext) ?></span>
                                        <span class="file-editor-name"><?= htmlspecialchars($f) ?></span>
                                        <?php if ($isBin): ?>
                                            <span class="file-binary-tag">binaire</span>
                                        <?php elseif ($can('edit_file')): ?>
                                            <span class="file-editor-arrow">&#9654;</span>
                                        <?php endif; ?>
                                    </div>
                                    <?php if (!$isBin && $can('edit_file')): ?>
                                    <div class="file-editor-body">
                                        <form method="POST">
                                            <input type="hidden" name="projet_id" value="<?= $p['id'] ?>">
                                            <input type="hidden" name="file_path" value="<?= htmlspecialchars($f) ?>">
                                            <textarea name="file_content" class="file-textarea" spellcheck="false"><?= htmlspecialchars($fContent) ?></textarea>
                                            <button type="submit" name="save_file" class="btn-action btn-save">Sauvegarder</button>
                                        </form>
                                    </div>
                                    <?php endif; ?>
                                </div>
                                <?php endforeach; ?>
                            <?php else: ?>
                                <span class="file-empty">Aucun fichier</span>
                            <?php endif; ?>
                        </div>
                    </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </section>

        <!-- SECTION APPS -->
        <section id="section-apps" class="section" style="display:none;">
            <div class="card">
                <h2>Applications</h2>
                <?php if (empty($apps)): ?>
                    <p class="empty-msg">Aucune application detectee.</p>
                <?php else: ?>
                    <div class="apps-grid">
                        <?php foreach ($apps as $app):
                            $appLink = file_exists(__DIR__ . '/../' . $app['nom'] . '/bridge.php')
                                ? '../' . $app['nom'] . '/bridge.php'
                                : $app['path'];
                        ?>
                        <a href="<?= htmlspecialchars($appLink) ?>" class="app-card" target="_blank">
                            <div class="app-icon">&#128187;</div>
                            <div class="app-info">
                                <span class="app-name"><?= htmlspecialchars($app['nom']) ?></span>
                                <span class="app-meta"><?= $app['file_count'] ?> elements</span>
                            </div>
                            <span class="app-arrow">&#10132;</span>
                        </a>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>
        </section>

        <?php if ($isAdmin): ?>
        <!-- SECTION TOUS LES PROJETS (admin) -->
        <section id="section-allprojets" class="section" style="display:none;">
            <div class="card">
                <h2>Tous les projets</h2>
                <?php
                $allProjetsView = getProjets($conn, true);
                if (empty($allProjetsView)): ?>
                    <p class="empty-msg">Aucun projet.</p>
                <?php else: ?>
                    <?php foreach ($allProjetsView as $p):
                        $isMine = ((int)($p['auteur_id'] ?? 0) === (int)$user['id']);
                        $apPath = $projetsDir . '/' . $p['nom'];
                        $apFiles = [];
                        if (is_dir($apPath)) {
                            foreach (scandir($apPath) as $f) {
                                if ($f === '.' || $f === '..') continue;
                                if (is_file($apPath . '/' . $f)) $apFiles[] = $f;
                            }
                        }
                    ?>
                    <div class="projet-block <?= $isMine ? 'projet-mine' : 'projet-other' ?> <?= ($p['visible'] === null) ? 'pendant' : (($p['visible'] == 0) ? 'hidden-projet' : '') ?>">
                        <div class="projet-block-header" onclick="this.parentElement.classList.toggle('open')">
                            <?php if (!empty($p['image'])): ?>
                                <img src="../<?= htmlspecialchars($p['image']) ?>" alt="" class="projet-link-img">
                            <?php else: ?>
                                <span class="projet-icon">&#128194;</span>
                            <?php endif; ?>
                            <span class="projet-nom"><?= htmlspecialchars($p['titre'] ?: $p['nom']) ?></span>
                            <?php if (!empty($p['auteur_nom'])): ?>
                                <span class="projet-auteur"><?= htmlspecialchars($p['auteur_nom']) ?></span>
                            <?php endif; ?>
                            <?php if ($p['visible'] == 1): ?>
                                <span class="vis-indicator vis-on" title="Visible">&#128065;</span>
                            <?php elseif ($p['visible'] === null): ?>
                                <span class="vis-indicator vis-pending" title="Non configure">&#10067;</span>
                            <?php else: ?>
                                <span class="vis-indicator vis-off" title="Masque">&#128065;&#8205;&#128488;</span>
                            <?php endif; ?>
                            <button class="btn-edit-projet" onclick="event.stopPropagation(); editProjet(<?= $p['id'] ?>);" title="Modifier">&#9998;</button>
                            <a href="../projet/<?= htmlspecialchars($p['nom']) ?>/" class="btn-open-projet" target="_blank" onclick="event.stopPropagation();">Ouvrir</a>
                            <span class="projet-block-arrow">&#9654;</span>
                        </div>
                        <div class="projet-block-body">
                            <!-- Modifier image -->
                            <form method="POST" enctype="multipart/form-data" class="edit-image-inline" onclick="event.stopPropagation();">
                                <input type="hidden" name="projet_id" value="<?= $p['id'] ?>">
                                <input type="hidden" name="titre" value="<?= htmlspecialchars($p['titre'] ?? '') ?>">
                                <input type="hidden" name="description" value="<?= htmlspecialchars($p['description'] ?? '') ?>">
                                <label class="image-dropzone-mini">
                                    <input type="file" name="image" accept="image/*" class="image-input" hidden>
                                    <?php if (!empty($p['image'])): ?>
                                        <img src="../<?= htmlspecialchars($p['image']) ?>" alt="" class="image-preview-mini">
                                        <span class="image-change-label">Changer</span>
                                    <?php else: ?>
                                        <span class="image-add-label">+ Photo</span>
                                    <?php endif; ?>
                                </label>
                                <noscript><button type="submit" name="update_info" class="btn-action btn-save">OK</button></noscript>
                            </form>
                            <?php if (!empty($apFiles)): ?>
                                <?php foreach ($apFiles as $f):
                                    $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
                                    $isBin = in_array($ext, $binaryExts);
                                    $fContent = $isBin ? '' : file_get_contents($apPath . '/' . $f);
                                ?>
                                <div class="file-editor-item">
                                    <div class="file-editor-header" onclick="<?= !$isBin ? "this.parentElement.classList.toggle('open')" : '' ?>">
                                        <span class="file-ext-badge">.<?= htmlspecialchars($ext) ?></span>
                                        <span class="file-editor-name"><?= htmlspecialchars($f) ?></span>
                                        <?php if ($isBin): ?>
                                            <span class="file-binary-tag">binaire</span>
                                        <?php else: ?>
                                            <span class="file-editor-arrow">&#9654;</span>
                                        <?php endif; ?>
                                    </div>
                                    <?php if (!$isBin): ?>
                                    <div class="file-editor-body">
                                        <form method="POST">
                                            <input type="hidden" name="projet_id" value="<?= $p['id'] ?>">
                                            <input type="hidden" name="file_path" value="<?= htmlspecialchars($f) ?>">
                                            <textarea name="file_content" class="file-textarea" spellcheck="false"><?= htmlspecialchars($fContent) ?></textarea>
                                            <button type="submit" name="save_file" class="btn-action btn-save">Sauvegarder</button>
                                        </form>
                                    </div>
                                    <?php endif; ?>
                                </div>
                                <?php endforeach; ?>
                            <?php else: ?>
                                <span class="file-empty">Aucun fichier</span>
                            <?php endif; ?>
                        </div>
                    </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </section>
        <?php endif; ?>

        <?php if (!empty($editProjets)): ?>
        <!-- SECTION MODIFIER -->
        <section id="section-mesprojets" class="section" style="display:none;">
            <div class="card">
                <h2><?= $isAdmin ? 'Modifier les projets' : 'Modifier mes projets' ?></h2>
                <button class="btn-show-all" onclick="showAllModifier()" style="display:none;">Voir tous les projets</button>
                <div class="admin-list">
                    <?php foreach ($editProjets as $p): ?>
                    <div class="admin-item" data-projet-id="<?= $p['id'] ?>">
                        <div class="admin-item-header">
                            <?php if (!empty($p['image'])): ?>
                                <img src="../<?= htmlspecialchars($p['image']) ?>" alt="" class="admin-item-thumb">
                            <?php else: ?>
                                <span class="projet-icon">&#128194;</span>
                            <?php endif; ?>
                            <div class="admin-item-info">
                                <span class="admin-item-nom"><?= htmlspecialchars($p['titre'] ?: $p['nom']) ?></span>
                                <span class="admin-item-folder"><?= htmlspecialchars($p['nom']) ?></span>
                            </div>
                            <?php if ($p['visible'] == 1): ?>
                                <span class="projet-status status-visible">Visible</span>
                            <?php else: ?>
                                <span class="projet-status status-hidden">Masque</span>
                            <?php endif; ?>
                        </div>

                        <?php if ($can('toggle_visible')): ?>
                        <div class="admin-item-actions">
                            <form method="POST" class="inline-form">
                                <input type="hidden" name="projet_id" value="<?= $p['id'] ?>">
                                <?php if ($p['visible'] === null || $p['visible'] == 0): ?>
                                    <input type="hidden" name="visible" value="1">
                                    <button type="submit" name="toggle_visible" class="btn-action btn-show">Rendre visible</button>
                                <?php else: ?>
                                    <input type="hidden" name="visible" value="0">
                                    <button type="submit" name="toggle_visible" class="btn-action btn-hide">Masquer</button>
                                <?php endif; ?>
                            </form>
                        </div>
                        <?php endif; ?>

                        <!-- Fichiers existants + creation -->
                        <div class="file-section">
                            <?php
                            $projetPath = $projetsDir . '/' . $p['nom'];
                            $files = [];
                            if (is_dir($projetPath)) {
                                foreach (scandir($projetPath) as $f) {
                                    if ($f === '.' || $f === '..') continue;
                                    if (is_file($projetPath . '/' . $f)) $files[] = $f;
                                }
                            }
                            ?>
                            <!-- Liste des fichiers editables -->
                            <div class="file-editor-list">
                                <?php if (!empty($files)): ?>
                                    <?php
                                    $binaryExts = ['png','jpg','jpeg','gif','bmp','ico','webp','mp3','mp4','wav','ogg','avi','mov','mkv','pdf','zip','rar','7z','tar','gz','exe','dll','so','bin','ttf','woff','woff2','eot','otf'];
                                    foreach ($files as $f):
                                        $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
                                        $isBinary = in_array($ext, $binaryExts);
                                        $fileContent = $isBinary ? '' : file_get_contents($projetPath . '/' . $f);
                                    ?>
                                    <div class="file-editor-item">
                                        <div class="file-editor-header" onclick="<?= !$isBinary ? "this.parentElement.classList.toggle('open')" : '' ?>">
                                            <span class="file-ext-badge">.<?= htmlspecialchars($ext) ?></span>
                                            <span class="file-editor-name"><?= htmlspecialchars($f) ?></span>
                                            <?php if ($isBinary): ?>
                                                <span class="file-binary-tag">binaire</span>
                                            <?php else: ?>
                                                <span class="file-editor-arrow">&#9654;</span>
                                            <?php endif; ?>
                                            <?php if ($can('delete_file')): ?>
                                            <form method="POST" class="file-delete-form" onclick="event.stopPropagation();">
                                                <input type="hidden" name="projet_id" value="<?= $p['id'] ?>">
                                                <input type="hidden" name="file_path" value="<?= htmlspecialchars($f) ?>">
                                                <button type="submit" name="delete_file" class="btn-delete-file" onclick="return confirm('Supprimer <?= htmlspecialchars($f) ?> ?');">&#10005;</button>
                                            </form>
                                            <?php endif; ?>
                                        </div>
                                        <?php if (!$isBinary && $can('edit_file')): ?>
                                        <div class="file-editor-body">
                                            <form method="POST">
                                                <input type="hidden" name="projet_id" value="<?= $p['id'] ?>">
                                                <input type="hidden" name="file_path" value="<?= htmlspecialchars($f) ?>">
                                                <textarea name="file_content" class="file-textarea" spellcheck="false"><?= htmlspecialchars($fileContent) ?></textarea>
                                                <button type="submit" name="save_file" class="btn-action btn-save">Sauvegarder</button>
                                            </form>
                                        </div>
                                        <?php endif; ?>
                                    </div>
                                    <?php endforeach; ?>
                                <?php else: ?>
                                    <span class="file-empty">Aucun fichier</span>
                                <?php endif; ?>
                            </div>

                            <?php if ($can('create_file')): ?>
                            <!-- Creer un fichier -->
                            <form method="POST" class="create-file-form">
                                <input type="hidden" name="projet_id" value="<?= $p['id'] ?>">
                                <input type="text" name="file_name" placeholder="Nom du fichier" required>
                                <input type="text" name="file_ext" list="ext-list-<?= $p['id'] ?>" placeholder="ext" required style="width:80px;">
                                <datalist id="ext-list-<?= $p['id'] ?>">
                                    <option value="html">
                                    <option value="css">
                                    <option value="js">
                                    <option value="php">
                                    <option value="json">
                                    <option value="txt">
                                    <option value="md">
                                    <option value="xml">
                                    <option value="svg">
                                    <option value="py">
                                    <option value="sql">
                                    <option value="ts">
                                    <option value="yaml">
                                    <option value="yml">
                                    <option value="env">
                                    <option value="ini">
                                    <option value="conf">
                                    <option value="htaccess">
                                    <option value="jsx">
                                    <option value="tsx">
                                    <option value="scss">
                                    <option value="less">
                                    <option value="vue">
                                </datalist>
                                <button type="submit" name="create_file" class="btn-action btn-save">+</button>
                            </form>
                            <?php endif; ?>
                        </div>

                        <?php if ($can('edit_info')): ?>
                        <form method="POST" enctype="multipart/form-data" class="admin-edit-form">
                            <input type="hidden" name="projet_id" value="<?= $p['id'] ?>">
                            <div class="edit-row">
                                <label>Titre</label>
                                <input type="text" name="titre" value="<?= htmlspecialchars($p['titre'] ?? '') ?>" placeholder="Titre du projet">
                            </div>
                            <div class="edit-row">
                                <label>Description</label>
                                <textarea name="description" rows="3" placeholder="Description courte du projet"><?= htmlspecialchars($p['description'] ?? '') ?></textarea>
                            </div>
                            <div class="edit-row">
                                <label>Image</label>
                                <div class="edit-image-zone">
                                    <label class="image-dropzone" data-id="<?= $p['id'] ?>">
                                        <input type="file" name="image" accept="image/*" class="image-input" hidden>
                                        <img src="<?= !empty($p['image']) ? '../' . htmlspecialchars($p['image']) : '' ?>"
                                             alt="" class="image-preview" <?= empty($p['image']) ? 'style="display:none;"' : '' ?>>
                                        <div class="image-placeholder" <?= !empty($p['image']) ? 'style="display:none;"' : '' ?>>
                                            <span class="image-placeholder-icon">&#128247;</span>
                                            <span>Cliquez pour ajouter</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                            <button type="submit" name="update_info" class="btn-action btn-save">Enregistrer</button>
                        </form>
                        <?php endif; ?>

                        <!-- Parametres sprite -->
                        <form method="POST" class="sprite-params-form">
                            <input type="hidden" name="projet_id" value="<?= $p['id'] ?>">
                            <div class="sprite-params-title">Apparence du sprite</div>
                            <div class="sprite-params-grid">
                                <div class="sprite-param">
                                    <label>Taille</label>
                                    <input type="range" name="sprite_size" min="30" max="200" value="<?= (int)($p['sprite_size'] ?? 100) ?>" oninput="this.nextElementSibling.textContent = this.value + '%'">
                                    <span class="sprite-param-val"><?= (int)($p['sprite_size'] ?? 100) ?>%</span>
                                </div>
                                <div class="sprite-param">
                                    <label>Force</label>
                                    <input type="range" name="sprite_force" min="10" max="300" value="<?= (int)($p['sprite_force'] ?? 100) ?>" oninput="this.nextElementSibling.textContent = this.value + '%'">
                                    <span class="sprite-param-val"><?= (int)($p['sprite_force'] ?? 100) ?>%</span>
                                </div>
                                <div class="sprite-param">
                                    <label>Vitesse</label>
                                    <input type="range" name="sprite_speed" min="10" max="300" value="<?= (int)($p['sprite_speed'] ?? 100) ?>" oninput="this.nextElementSibling.textContent = this.value + '%'">
                                    <span class="sprite-param-val"><?= (int)($p['sprite_speed'] ?? 100) ?>%</span>
                                </div>
                                <div class="sprite-param">
                                    <label>Couleur</label>
                                    <input type="color" name="sprite_color" value="<?= htmlspecialchars($p['sprite_color'] ?? '#6c5ce7') ?>">
                                </div>
                            </div>
                            <button type="submit" name="save_sprite" class="btn-action btn-save">Appliquer</button>
                        </form>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </section>
        <?php endif; ?>

        <?php if ($isAdmin && !empty($pendants)): ?>
        <!-- SECTION CONFIGURER -->
        <section id="section-config" class="section" style="display:none;">
            <div class="card">
                <h2>Projets sans auteur</h2>
                <p style="color:#94a3b8;font-size:13px;margin-bottom:12px;">Attribue un auteur a chaque projet. La visibilite se gere dans l'onglet BDD.</p>
                <div class="admin-list">
                    <?php foreach ($pendants as $pc): ?>
                    <div class="admin-item item-pending">
                        <div class="admin-item-header">
                            <span class="projet-icon">&#128194;</span>
                            <div class="admin-item-info">
                                <span class="admin-item-nom"><?= htmlspecialchars($pc['nom']) ?></span>
                            </div>
                            <span class="projet-status status-pending">Sans auteur</span>
                        </div>
                        <div class="admin-item-actions">
                            <form method="POST" class="inline-form">
                                <input type="hidden" name="projet_id" value="<?= $pc['id'] ?>">
                                <input type="hidden" name="from_tab" value="config">
                                <select name="auteur_id" class="select-auteur">
                                    <option value="0">-- Auteur --</option>
                                    <?php foreach ($allUsers as $u): ?>
                                        <option value="<?= $u['id'] ?>"><?= htmlspecialchars($u['name'] ?: $u['email']) ?></option>
                                    <?php endforeach; ?>
                                </select>
                                <button type="submit" name="set_auteur" class="btn-action btn-assign">Attribuer</button>
                            </form>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </section>
        <?php endif; ?>

        <!-- SECTION PROFIL -->
        <section id="section-profil" class="section" style="display:none;">
            <div class="card">
                <h2>Mon profil</h2>
                <table class="info-table">
                    <tr><td>Nom complet</td><td><?= htmlspecialchars($user['name']) ?></td></tr>
                    <tr><td>Prenom</td><td><?= htmlspecialchars($user['given_name'] ?? '') ?></td></tr>
                    <tr><td>Nom de famille</td><td><?= htmlspecialchars($user['family_name'] ?? '') ?></td></tr>
                    <tr><td>Email</td><td><?= htmlspecialchars($user['email']) ?></td></tr>
                    <tr><td>Langue</td><td><?= htmlspecialchars($user['locale'] ?? '') ?></td></tr>
                    <tr><td>Google ID</td><td style="font-size:11px;"><?= htmlspecialchars($user['google_id']) ?></td></tr>
                    <tr><td>Connexions</td><td><span class="badge badge-count"><?= (int)$user['login_count'] ?></span></td></tr>
                </table>
            </div>
        </section>

        <?php if ($isAdmin): ?>
        <!-- SECTION ADMIN -->
        <section id="section-admin" class="section" style="display:none;">

            <!-- Permissions globales -->
            <div class="card" style="margin-bottom: 20px;">
                <h2>Permissions utilisateurs</h2>
                <form method="POST">
                    <div class="perms-grid">
                        <?php
                        $permLabels = [
                            'create_projet' => 'Creer un projet',
                            'edit_info' => 'Modifier titre / description / image',
                            'toggle_visible' => 'Rendre visible / invisible',
                            'create_file' => 'Creer des fichiers',
                            'edit_file' => 'Editer le contenu des fichiers',
                            'delete_file' => 'Supprimer des fichiers',
                        ];
                        foreach ($permLabels as $key => $label): ?>
                        <label class="perm-item">
                            <input type="checkbox" name="<?= $key ?>" value="1" <?= !empty($perms[$key]) ? 'checked' : '' ?>>
                            <span class="perm-label"><?= $label ?></span>
                        </label>
                        <?php endforeach; ?>
                    </div>
                    <button type="submit" name="save_permissions" class="btn-action btn-save" style="margin-top: 14px;">Enregistrer les permissions</button>
                </form>
            </div>

            <?php if ($isSuperAdmin): ?>
            <!-- Gestion utilisateurs — SUPER ADMIN uniquement -->
            <div class="card" style="margin-bottom: 20px;">
                <h2>Gestion des utilisateurs</h2>
                <div class="admin-list">
                    <?php foreach ($allUsers as $u): ?>
                    <div class="admin-item">
                        <div class="admin-item-header">
                            <span class="admin-item-nom"><?= htmlspecialchars($u['name'] ?: $u['email']) ?></span>
                            <span class="admin-item-folder"><?= htmlspecialchars($u['email']) ?></span>
                            <?php if ($u['email'] === 'admin@local'): ?>
                                <span class="projet-status status-visible">Super Admin</span>
                            <?php elseif ($u['is_admin']): ?>
                                <span class="projet-status status-visible">Admin</span>
                            <?php else: ?>
                                <span class="projet-status status-hidden">Utilisateur</span>
                            <?php endif; ?>
                        </div>
                        <?php if ($u['email'] !== 'admin@local'): ?>
                        <div class="admin-item-actions">
                            <form method="POST" class="inline-form">
                                <input type="hidden" name="user_id" value="<?= $u['id'] ?>">
                                <?php if ($u['is_admin']): ?>
                                    <input type="hidden" name="make_admin" value="0">
                                    <button type="submit" name="toggle_admin" class="btn-action btn-hide">Revoquer admin</button>
                                <?php else: ?>
                                    <input type="hidden" name="make_admin" value="1">
                                    <button type="submit" name="toggle_admin" class="btn-action btn-show">Promouvoir admin</button>
                                <?php endif; ?>
                            </form>
                        </div>
                        <?php endif; ?>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>
            <?php endif; ?>

            <!-- Gestion projets -->
            <div class="card">
                <h2>Gestion des projets</h2>
                <?php
                $allProjets = getProjets($conn, true);
                if (empty($allProjets)): ?>
                    <p class="empty-msg">Aucun projet a gerer.</p>
                <?php else: ?>
                    <div class="admin-list">
                        <?php foreach ($allProjets as $p): ?>
                        <div class="admin-item <?= ($p['visible'] === null) ? 'item-pending' : '' ?>">
                            <div class="admin-item-header">
                                <?php if (!empty($p['image'])): ?>
                                    <img src="../<?= htmlspecialchars($p['image']) ?>" alt="" class="admin-item-thumb">
                                <?php else: ?>
                                    <span class="projet-icon">&#128194;</span>
                                <?php endif; ?>
                                <div class="admin-item-info">
                                    <span class="admin-item-nom"><?= htmlspecialchars($p['titre'] ?: $p['nom']) ?></span>
                                    <span class="admin-item-folder"><?= htmlspecialchars($p['nom']) ?></span>
                                </div>
                                <?php if ($p['visible'] === null): ?>
                                    <span class="projet-status status-pending">En attente</span>
                                <?php elseif ($p['visible'] == 1): ?>
                                    <span class="projet-status status-visible">Visible</span>
                                <?php else: ?>
                                    <span class="projet-status status-hidden">Masque</span>
                                <?php endif; ?>
                            </div>

                            <div class="admin-item-actions">
                                <!-- Toggle visibilite -->
                                <form method="POST" class="inline-form">
                                    <input type="hidden" name="projet_id" value="<?= $p['id'] ?>">
                                    <?php if ($p['visible'] === null || $p['visible'] == 0): ?>
                                        <input type="hidden" name="visible" value="1">
                                        <button type="submit" name="toggle_visible" class="btn-action btn-show">Rendre visible</button>
                                    <?php else: ?>
                                        <input type="hidden" name="visible" value="0">
                                        <button type="submit" name="toggle_visible" class="btn-action btn-hide">Masquer</button>
                                    <?php endif; ?>
                                </form>
                                <!-- Auteur -->
                                <form method="POST" class="inline-form">
                                    <input type="hidden" name="projet_id" value="<?= $p['id'] ?>">
                                    <select name="auteur_id" class="select-auteur">
                                        <option value="0">-- Auteur --</option>
                                        <?php foreach ($allUsers as $u): ?>
                                            <option value="<?= $u['id'] ?>" <?= ($p['auteur_id'] == $u['id']) ? 'selected' : '' ?>>
                                                <?= htmlspecialchars($u['name'] ?: $u['email']) ?>
                                            </option>
                                        <?php endforeach; ?>
                                    </select>
                                    <button type="submit" name="set_auteur" class="btn-action btn-assign">OK</button>
                                </form>
                            </div>

                            <!-- Formulaire titre / description / image -->
                            <form method="POST" enctype="multipart/form-data" class="admin-edit-form">
                                <input type="hidden" name="projet_id" value="<?= $p['id'] ?>">
                                <div class="edit-row">
                                    <label>Titre</label>
                                    <input type="text" name="titre" value="<?= htmlspecialchars($p['titre'] ?? '') ?>" placeholder="Titre du projet">
                                </div>
                                <div class="edit-row">
                                    <label>Description</label>
                                    <textarea name="description" rows="3" placeholder="Description courte du projet"><?= htmlspecialchars($p['description'] ?? '') ?></textarea>
                                </div>
                                <div class="edit-row">
                                    <label>Image</label>
                                    <div class="edit-image-zone">
                                        <label class="image-dropzone" data-id="<?= $p['id'] ?>">
                                            <input type="file" name="image" accept="image/*" class="image-input" hidden>
                                            <img src="<?= !empty($p['image']) ? '../' . htmlspecialchars($p['image']) : '' ?>"
                                                 alt="" class="image-preview" <?= empty($p['image']) ? 'style="display:none;"' : '' ?>>
                                            <div class="image-placeholder" <?= !empty($p['image']) ? 'style="display:none;"' : '' ?>>
                                                <span class="image-placeholder-icon">&#128247;</span>
                                                <span>Cliquez pour ajouter</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                                <button type="submit" name="update_info" class="btn-action btn-save">Enregistrer</button>
                            </form>
                        </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>
        </section>
        <?php endif; ?>

        <?php if ($isAdmin): ?>
        <!-- SECTION BDD — vue directe de la table projets -->
        <section id="section-bdd" class="section" style="display:none;">
            <div class="card">
                <h2>Table projets (BDD)</h2>
                <p style="color:#94a3b8;font-size:13px;margin-bottom:12px;">Vue directe de la base de donnees. Modifie auteur et visibilite ici.</p>
                <div style="overflow-x:auto;">
                <table class="bdd-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nom dossier</th>
                            <th>Titre</th>
                            <th>Visible</th>
                            <th>Auteur</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                    <?php
                    $allProjetsBdd = $conn->query("SELECT p.*, u.name AS auteur_nom, u.email AS auteur_email FROM projets p LEFT JOIN users u ON p.auteur_id = u.id ORDER BY p.nom");
                    while ($bp = $allProjetsBdd->fetch_assoc()):
                    ?>
                        <tr class="<?= ($bp['visible'] === null) ? 'bdd-row-pending' : (($bp['visible'] == 0) ? 'bdd-row-hidden' : '') ?>">
                            <td><?= $bp['id'] ?></td>
                            <td><strong><?= htmlspecialchars($bp['nom']) ?></strong></td>
                            <td><?= htmlspecialchars($bp['titre'] ?? '-') ?></td>
                            <td>
                                <?php if ($bp['visible'] === null): ?>
                                    <span style="color:#f59e0b;">NULL</span>
                                <?php elseif ($bp['visible'] == 1): ?>
                                    <span style="color:#22c55e;">Oui</span>
                                <?php else: ?>
                                    <span style="color:#ef4444;">Non</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <?php if ($bp['auteur_id']): ?>
                                    <?= htmlspecialchars($bp['auteur_nom'] ?: $bp['auteur_email']) ?> <small>(id=<?= $bp['auteur_id'] ?>)</small>
                                <?php else: ?>
                                    <span style="color:#f59e0b;">Aucun</span>
                                <?php endif; ?>
                            </td>
                            <td style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;">
                                <form method="POST" style="display:flex;gap:4px;align-items:center;">
                                    <input type="hidden" name="projet_id" value="<?= $bp['id'] ?>">
                                    <input type="hidden" name="from_tab" value="bdd">
                                    <select name="auteur_id" style="padding:8px 10px;font-size:14px;background:#1e293b;color:#e2e8f0;border:1px solid #334155;border-radius:6px;">
                                        <option value="0">-- Aucun --</option>
                                        <?php foreach ($allUsers as $u): ?>
                                            <option value="<?= $u['id'] ?>" <?= ($bp['auteur_id'] == $u['id']) ? 'selected' : '' ?>><?= htmlspecialchars($u['name'] ?: $u['email']) ?></option>
                                        <?php endforeach; ?>
                                    </select>
                                    <button type="submit" name="set_auteur" style="padding:8px 16px;font-size:14px;background:#6366f1;color:white;border:none;border-radius:6px;cursor:pointer;">OK</button>
                                </form>
                                <form method="POST" style="display:inline;">
                                    <input type="hidden" name="projet_id" value="<?= $bp['id'] ?>">
                                    <input type="hidden" name="from_tab" value="bdd">
                                    <?php if ($bp['visible'] === null || $bp['visible'] == 0): ?>
                                        <input type="hidden" name="visible" value="1">
                                        <button type="submit" name="toggle_visible" style="padding:8px 16px;font-size:14px;background:#22c55e;color:white;border:none;border-radius:6px;cursor:pointer;">Visible</button>
                                    <?php else: ?>
                                        <input type="hidden" name="visible" value="0">
                                        <button type="submit" name="toggle_visible" style="padding:8px 16px;font-size:14px;background:#ef4444;color:white;border:none;border-radius:6px;cursor:pointer;">Masquer</button>
                                    <?php endif; ?>
                                </form>
                            </td>
                        </tr>
                    <?php endwhile; ?>
                    </tbody>
                </table>
                </div>
            </div>
        </section>
        <?php endif; ?>

        <a href="../auth/logout.php" class="btn-logout">Se deconnecter</a>
    </div>

    <script>
    // Navigation onglets
    function switchTab(target) {
        document.querySelectorAll('.menu-btn').forEach(function(b) { b.classList.remove('active'); });
        document.querySelectorAll('.section').forEach(function(s) { s.style.display = 'none'; });
        var btn = document.querySelector('.menu-btn[data-target="' + target + '"]');
        if (btn) btn.classList.add('active');
        var section = document.getElementById(target);
        if (section) section.style.display = 'block';
    }
    document.querySelectorAll('.menu-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            switchTab(btn.dataset.target);
        });
    });
    // Ouvrir l'onglet demande par l'URL
    var params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'mesprojets') {
        switchTab('section-mesprojets');
    } else if (params.get('tab') === 'admin') {
        switchTab('section-admin');
    } else if (params.get('tab') === 'config') {
        switchTab('section-config');
    } else if (params.get('tab') === 'bdd') {
        switchTab('section-bdd');
    } else if (params.get('tab') === 'apps') {
        switchTab('section-apps');
    }

    // Modifier un projet specifique — masque les autres
    function editProjet(projetId) {
        switchTab('section-mesprojets');
        var items = document.querySelectorAll('#section-mesprojets .admin-item');
        var btnAll = document.querySelector('#section-mesprojets .btn-show-all');
        items.forEach(function(item) {
            if (parseInt(item.dataset.projetId) === projetId) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
        if (btnAll) btnAll.style.display = 'inline-block';
    }

    // Reafficher tous les projets dans Modifier
    function showAllModifier() {
        var items = document.querySelectorAll('#section-mesprojets .admin-item');
        items.forEach(function(item) { item.style.display = ''; });
        var btnAll = document.querySelector('#section-mesprojets .btn-show-all');
        if (btnAll) btnAll.style.display = 'none';
    }

    // === Univers Kirby arriere-plan ===
    (function() {
        // Etoiles
        var starsEl = document.getElementById('kirbyStars');
        for (var s = 0; s < 50; s++) {
            var star = document.createElement('div');
            var r = Math.random();
            star.className = 'kirby-star' + (r > 0.92 ? ' big blink' : r > 0.75 ? ' blink' : r > 0.6 ? ' blink-slow' : '');
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 55 + '%';
            star.style.animationDelay = (Math.random() * 3).toFixed(1) + 's';
            starsEl.appendChild(star);
        }

        // Nuages
        var cloudsEl = document.getElementById('kirbyClouds');
        var cloudData = [];
        for (var c = 0; c < 4; c++) {
            var cloud = document.createElement('div');
            cloud.className = 'kirby-cloud';
            var cw = 100 + Math.random() * 160;
            cloud.style.width = cw + 'px';
            cloud.style.height = (20 + Math.random() * 18) + 'px';
            cloud.style.top = (10 + Math.random() * 40) + '%';
            cloud.style.opacity = 0.3 + Math.random() * 0.4;
            var cx = Math.random() * window.innerWidth;
            cloudsEl.appendChild(cloud);
            cloudData.push({ el: cloud, x: cx, speed: 0.12 + Math.random() * 0.2, w: cw });
        }

        // Herbe
        var grassEl = document.getElementById('groundGrass');
        var gc = Math.floor(window.innerWidth / 10);
        for (var g = 0; g < gc; g++) {
            var blade = document.createElement('div');
            blade.className = 'grass-blade';
            blade.style.left = (g / gc * 100) + '%';
            blade.style.animationDelay = (Math.random() * 3).toFixed(1) + 's';
            grassEl.appendChild(blade);
        }

        // Sprites projets visibles
        var userId = <?= (int)$user['id'] ?>;
        var projets = <?= json_encode(array_map(function($p) {
            return [
                'nom' => $p['titre'] ?: $p['nom'],
                'image' => $p['image'] ?? '',
                'url' => '../projet/' . $p['nom'] . '/',
                'auteur_id' => (int)($p['auteur_id'] ?? 0),
                'sprite_size' => (int)($p['sprite_size'] ?? 100),
                'sprite_force' => (int)($p['sprite_force'] ?? 100),
                'sprite_color' => $p['sprite_color'] ?? '#6c5ce7',
                'sprite_speed' => (int)($p['sprite_speed'] ?? 100),
            ];
        }, getProjets($conn, false))) ?>;

        if (projets.length) {
            var sky = document.getElementById('kirbySky');
            var sprites = [];
            var W, H;
            function measure() {
                var rect = sky.getBoundingClientRect();
                W = rect.width;
                H = rect.height;
            }
            measure();
            window.addEventListener('resize', measure);

            projets.forEach(function(p, i) {
                var owned = (p.auteur_id === userId);
                var sizeScale = (p.sprite_size || 100) / 100;
                var forceScale = (p.sprite_force || 100) / 100;
                var speedScale = (p.sprite_speed || 100) / 100;
                var color = p.sprite_color || '#6c5ce7';

                var el = document.createElement('a');
                el.className = 'floating-sprite' + (owned ? ' sprite-mine' : ' sprite-enemy');
                el.href = p.url;
                el.target = '_blank';
                el.title = p.nom;
                el.style.borderColor = color + '66';
                el.style.width = Math.round(110 * sizeScale) + 'px';
                el.style.boxShadow = '0 0 12px ' + color + '33';

                if (p.image) {
                    var img = document.createElement('img');
                    img.src = '../' + p.image;
                    img.alt = p.nom;
                    el.appendChild(img);
                } else {
                    var icon = document.createElement('span');
                    icon.className = 'floating-icon';
                    icon.textContent = '\uD83D\uDCC2';
                    el.appendChild(icon);
                }

                var label = document.createElement('span');
                label.className = 'floating-label';
                label.textContent = p.nom;
                el.appendChild(label);

                sky.appendChild(el);

                var total = projets.length;
                var spriteW = Math.round((owned ? 85 : 130) * sizeScale);
                var spriteH = Math.round((owned ? 90 : 140) * sizeScale);
                var maxY = H - spriteH;
                var slotH = maxY / total;

                var x = Math.random() * Math.max(0, W - spriteW);
                var y = slotH * i + Math.random() * Math.max(0, slotH * 0.3);

                var speed = (owned ? 1.5 : 1) * speedScale;
                sprites.push({
                    el: el, x: x, baseY: y, y: y,
                    vx: (0.3 + Math.random() * 0.5) * speed * (Math.random() < 0.5 ? 1 : -1),
                    vy: (0.05 + Math.random() * 0.12) * (Math.random() < 0.5 ? 1 : -1),
                    wave: (i / total) * Math.PI * 2 + Math.random() * 0.5,
                    waveSpeed: 0.012 + Math.random() * 0.015,
                    waveAmp: 8 + Math.random() * 12,
                    spriteW: el.offsetWidth || Math.round((owned ? 85 : 130) * sizeScale),
                    spriteH: el.offsetHeight || Math.round((owned ? 90 : 140) * sizeScale),
                    facingRight: true,
                    owned: owned,
                    force: forceScale,
                    speed: speedScale,
                    knockX: 0, knockY: 0,
                    target: null, stunned: 0
                });
            });


            // Gravite et sol pour les sprites owned
            // Flag pour recalcul tailles
            var needsResize = true;
            setTimeout(function() { needsResize = true; }, 200);

            var gravity = 0.18;
            var groundY = H - 130; // juste au-dessus du sol

            // Init : les projets owned commencent au sol
            sprites.forEach(function(s) {
                if (s.owned) {
                    s.baseY = groundY;
                    s.y = groundY;
                    s.vyJump = 0;
                    s.onGround = true;
                    s.vy = 0;
                }
            });

            function animate() {
                // Recalculer tailles reelles du DOM
                if (needsResize) {
                    sprites.forEach(function(s) {
                        var w = s.el.offsetWidth;
                        var h = s.el.offsetHeight;
                        if (w > 0 && h > 0) { s.spriteW = w; s.spriteH = h; }
                    });
                    needsResize = false;
                }
                var ww = window.innerWidth;
                cloudData.forEach(function(c) {
                    c.x += c.speed;
                    if (c.x > ww + 20) c.x = -c.w - 20;
                    c.el.style.transform = 'translateX(' + c.x.toFixed(1) + 'px)';
                });

                var maxY = H - 120;

                // Bouger les sprites
                sprites.forEach(function(s) {
                    if (s.owned) {
                        // --- MES PROJETS : au sol avec gravite ---
                        s.x += s.vx * 0.5 * s.speed;

                        // Gravite
                        s.vyJump += gravity;
                        s.y += s.vyJump;

                        // Sol
                        if (s.y >= groundY) {
                            s.y = groundY;
                            s.vyJump = 0;
                            s.onGround = true;
                        }

                        // Rebond horizontal
                        if (s.x <= 0) { s.x = 0; s.vx = Math.abs(s.vx); s.facingRight = true; }
                        if (s.x >= W - s.spriteW) { s.x = W - s.spriteW; s.vx = -Math.abs(s.vx); s.facingRight = false; }

                        // Detecter ennemi proche et esquiver en sautant
                        var closestDist = 9999;
                        sprites.forEach(function(e) {
                            if (e.owned) return;
                            var dx = (s.x + s.spriteW / 2) - (e.x + e.spriteW / 2);
                            var dy = (s.y + s.spriteH / 2) - (e.y + e.spriteH / 2);
                            var dist = Math.sqrt(dx * dx + dy * dy);
                            if (dist < closestDist) closestDist = dist;
                        });
                        // Sauter pour esquiver quand un ennemi approche
                        if (closestDist < 180 && s.onGround && Math.random() < 0.04) {
                            s.vyJump = -(4 + Math.random() * 3);
                            s.onGround = false;
                        }

                    } else {
                        // --- PROJETS ENNEMIS : volent librement ---
                        // Appliquer recul progressif (knockback)
                        if (s.knockX || s.knockY) {
                            s.x += s.knockX;
                            s.baseY += s.knockY;
                            s.knockX *= 0.92;
                            s.knockY *= 0.92;
                            if (Math.abs(s.knockX) < 0.05) s.knockX = 0;
                            if (Math.abs(s.knockY) < 0.05) s.knockY = 0;
                        }
                        s.x += s.vx * s.speed;
                        s.wave += s.waveSpeed;
                        s.baseY += s.vy * 0.25;
                        s.y = s.baseY + Math.sin(s.wave) * s.waveAmp;

                        // Comportement ennemi
                        var ownedList = sprites.filter(function(m) { return m.owned; });
                        if (ownedList.length) {
                            if (s.stunned > 0) {
                                // STUNNED : rode en cercle sans cibler
                                s.stunned--;
                                s.wave += s.waveSpeed * 2;
                                s.vx *= 0.98; // ralentit doucement
                            } else {
                                // Verifier qu'aucun autre ennemi n'est deja en train d'attaquer la meme cible
                                var activeAttackers = sprites.filter(function(o) {
                                    return !o.owned && o !== s && o.stunned <= 0 && o.target;
                                });
                                var takenTargets = activeAttackers.map(function(o) { return o.target; });

                                if (!s.target) {
                                    // Choisir une cible pas deja prise par un autre
                                    var candidates = ownedList.filter(function(m) {
                                        return takenTargets.indexOf(m) === -1;
                                    });
                                    if (!candidates.length) candidates = ownedList;
                                    var best = null, bestDist = 9999;
                                    candidates.forEach(function(m) {
                                        var dx = (s.x+s.spriteW/2)-(m.x+m.spriteW/2);
                                        var dy = (s.y+s.spriteH/2)-(m.y+m.spriteH/2);
                                        var d = Math.sqrt(dx*dx+dy*dy);
                                        if (d < bestDist) { bestDist = d; best = m; }
                                    });
                                    s.target = best;
                                }

                                // Foncer vers la cible
                                var t = s.target;
                                if (t) {
                                    var tdx = (t.x+t.spriteW/2)-(s.x+s.spriteW/2);
                                    var tdy = (t.y+t.spriteH/2)-(s.y+s.spriteH/2);
                                    var tDist = Math.sqrt(tdx*tdx+tdy*tdy);
                                    var angle = Math.atan2(tdy, tdx);
                                    var accel = tDist > 200 ? 0.12 : 0.06;
                                    s.vx += Math.cos(angle) * accel;
                                    s.baseY += Math.sin(angle) * accel * 2;
                                    s.facingRight = tdx > 0;
                                }
                            }
                        }

                        // Bornes
                        if (s.x <= 0) { s.x = 0; s.vx = Math.abs(s.vx); s.facingRight = true; }
                        if (s.x >= W - s.spriteW) { s.x = W - s.spriteW; s.vx = -Math.abs(s.vx); s.facingRight = false; }
                        if (s.baseY <= 0) { s.baseY = 0; s.vy = Math.abs(s.vy); }
                        if (s.baseY >= maxY) { s.baseY = maxY; s.vy = -Math.abs(s.vy); }
                        if (s.y < 0) s.y = 0;
                        if (s.y > maxY) s.y = maxY;
                        // Limiter vitesse (adapte au speed)
                        var maxVx = 2.5 * s.speed;
                        if (s.vx > maxVx) s.vx = maxVx;
                        if (s.vx < -maxVx) s.vx = -maxVx;
                    }

                    s.el.style.transform = 'translate(' + s.x.toFixed(1) + 'px,' + s.y.toFixed(1) + 'px)';
                    var spriteImg = s.el.querySelector('img') || s.el.querySelector('.floating-icon');
                    if (spriteImg) spriteImg.style.transform = s.facingRight ? '' : 'scaleX(-1)';
                });

                // Detection collision AABB (bords des carres) + force
                for (var ai = 0; ai < sprites.length; ai++) {
                    for (var bi = ai + 1; bi < sprites.length; bi++) {
                        var a = sprites[ai], b = sprites[bi];
                        // AABB : les carres se touchent ?
                        // AABB avec marge de 6px pour eviter faux positifs
                        var margin = 6;
                        if (a.x + margin < b.x + b.spriteW - margin && a.x + a.spriteW - margin > b.x + margin &&
                            a.y + margin < b.y + b.spriteH - margin && a.y + a.spriteH - margin > b.y + margin) {

                            // Pas de collision entre 2 owned
                            if (a.owned && b.owned) continue;

                            var dx = (a.x + a.spriteW/2) - (b.x + b.spriteW/2);
                            var dy = (a.y + a.spriteH/2) - (b.y + b.spriteH/2);
                            var angle = Math.atan2(dy, dx);

                            var forceA = a.force || 1;
                            var forceB = b.force || 1;
                            var knockPower = 10;

                            // Owned ne recule jamais, continue a marcher
                            if (a.owned && !b.owned) {
                                // b (ennemi) est projete selon la force
                                var ratio = forceA / (forceA + forceB);
                                b.knockX = -Math.cos(angle) * knockPower * (0.5 + ratio);
                                b.knockY = -Math.sin(angle) * knockPower * (0.5 + ratio);
                                b.vx = 0;
                                b.stunned = 120; b.target = null;
                            } else if (b.owned && !a.owned) {
                                // a (ennemi) est projete selon la force
                                var ratio = forceB / (forceA + forceB);
                                a.knockX = Math.cos(angle) * knockPower * (0.5 + ratio);
                                a.knockY = Math.sin(angle) * knockPower * (0.5 + ratio);
                                a.vx = 0;
                                a.stunned = 120; a.target = null;
                            } else {
                                // 2 ennemis : le plus faible recule plus
                                var totalForce = forceA + forceB;
                                a.knockX = Math.cos(angle) * knockPower * (forceB / totalForce);
                                a.knockY = Math.sin(angle) * knockPower * (forceB / totalForce);
                                b.knockX = -Math.cos(angle) * knockPower * (forceA / totalForce);
                                b.knockY = -Math.sin(angle) * knockPower * (forceA / totalForce);
                                if (forceA < forceB) { a.vx = 0; a.stunned = 120; a.target = null; }
                                else if (forceB < forceA) { b.vx = 0; b.stunned = 120; b.target = null; }
                                else { a.vx = 0; b.vx = 0; }
                            }

                        }
                    }
                }

                // Separation entre rouges — eviter chevauchement (soft push)
                var enemies = sprites.filter(function(s) { return !s.owned; });
                for (var ei = 0; ei < enemies.length; ei++) {
                    for (var ej = ei + 1; ej < enemies.length; ej++) {
                        var a = enemies[ei], b = enemies[ej];
                        // AABB overlap
                        var overlapX = Math.min(a.x + a.spriteW, b.x + b.spriteW) - Math.max(a.x, b.x);
                        var overlapY = Math.min(a.y + a.spriteH, b.y + b.spriteH) - Math.max(a.y, b.y);
                        if (overlapX > 0 && overlapY > 0) {
                            var dx = (a.x + a.spriteW/2) - (b.x + b.spriteW/2);
                            var dy = (a.y + a.spriteH/2) - (b.y + b.spriteH/2);
                            var angle = Math.atan2(dy, dx);
                            var push = Math.min(overlapX, overlapY) * 0.1;
                            a.x += Math.cos(angle) * push;
                            a.baseY += Math.sin(angle) * push;
                            b.x -= Math.cos(angle) * push;
                            b.baseY -= Math.sin(angle) * push;
                        }
                    }
                }


                requestAnimationFrame(animate);
            }
            animate();
        } else {
            // Animer juste les nuages
            function animClouds() {
                var ww = window.innerWidth;
                cloudData.forEach(function(c) {
                    c.x += c.speed;
                    if (c.x > ww + 20) c.x = -c.w - 20;
                    c.el.style.transform = 'translateX(' + c.x.toFixed(1) + 'px)';
                });
                requestAnimationFrame(animClouds);
            }
            animClouds();
        }
    })();

    // Apercu image avant upload + auto-submit pour les mini dropzones
    document.querySelectorAll('.image-input').forEach(function(input) {
        input.addEventListener('change', function() {
            var file = this.files[0];
            if (!file || !file.type.startsWith('image/')) return;

            // Auto-submit pour les blocs projet (inline)
            var inlineForm = this.closest('.edit-image-inline');
            if (inlineForm) {
                // Ajouter update_info pour le traitement serveur
                var hidden = document.createElement('input');
                hidden.type = 'hidden';
                hidden.name = 'update_info';
                hidden.value = '1';
                inlineForm.appendChild(hidden);
                inlineForm.submit();
                return;
            }

            // Apercu classique pour les dropzones de la section Modifier
            var zone = this.closest('.image-dropzone');
            if (zone) {
                var preview = zone.querySelector('.image-preview');
                var placeholder = zone.querySelector('.image-placeholder');
                var reader = new FileReader();
                reader.onload = function(e) {
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                    if (placeholder) placeholder.style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        });
    });
    </script>
</body>
</html>
