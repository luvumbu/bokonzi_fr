<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Projet</title>
    <link rel="stylesheet" href="../../css.css">
</head>
<body>
<nav class="simpson-menu">
    <ul>
        <li><a href="#">➕ Ajouter un projet</a></li>
        <li><a href="#">⚙ Paramètres</a></li>
        <li><a href="#">🚪 Déconnexion</a></li>
    </ul>
</nav>

<div class="simpson-container">

    <h1 class="simpson-h1">Gestion du projet</h1>

    <form class="simpson-form">
<div class="image-wrapper">
    <img src="https://i.pinimg.com/1200x/23/c3/f5/23c3f5f17744088a2d2ed2ab1630c7d1.jpg" alt="Projet">
    
    <!-- Actions -->
    <div class="image-actions">
        <label class="select-btn">
            <input type="file" accept="image/*">
            🔄 Changer
        </label>
        <span class="vd-trash" title="Supprimer l’image">🗑️</span>
    </div>
</div>



<div class="image-children-wrapper">
    <!-- Bouton Ajouter un child -->
    <button type="button" class="add-child-btn">➕ Ajouter un child</button>

    <!-- Liste des childs -->
    <div class="child-list">
        <div class="child-item">
            <img src="https://i.pinimg.com/1200x/23/c3/f5/23c3f5f17744088a2d2ed2ab1630c7d1.jpg" alt="Child 1">
            <span class="vd-trash" title="Supprimer ce child">🗑️</span>
            
        </div>
        <div class="child-item">
            <img src="https://i.pinimg.com/1200x/23/c3/f5/23c3f5f17744088a2d2ed2ab1630c7d1.jpg" alt="Child 2">
            <span class="vd-trash" title="Supprimer ce child">🗑️</span>
        </div>
        <div class="child-item">
            <img src="https://i.pinimg.com/1200x/23/c3/f5/23c3f5f17744088a2d2ed2ab1630c7d1.jpg" alt="Child 3">
            <span class="vd-trash" title="Supprimer ce child">🗑️</span>
        </div>
    </div>
</div>


        <!-- Titre du projet -->
        <div class="field">
            <div class="field-header">
                <input type="checkbox" id="project_title_ck" name="project_title_ck">
                <label for="project_title">Titre du projet</label>
            </div>
            <div class="input-line">
                <input type="text" id="project_title" name="project_title">
                <span class="vd-trash" title="Vider le champ">🗑️</span>
            </div>
        </div>

        <!-- Description -->
        <div class="field">
            <div class="field-header">
                <input type="checkbox" id="project_description_ck" name="project_description_ck">
                <label for="project_description">Description</label>
            </div>
            <div class="input-line">
                <textarea id="project_description" name="project_description"></textarea>
                <span class="vd-trash" title="Vider le champ">🗑️</span>
            </div>
        </div>

        <!-- Meta projet -->
        <div class="field">
            <div class="field-header">
                <input type="checkbox" id="meta_project_ck" name="meta_project_ck">
                <label for="meta_project">Meta projet</label>
            </div>
            <div class="input-line">
                <input type="text" id="meta_project" name="meta_project">
                <span class="vd-trash" title="Vider le champ">🗑️</span>
            </div>
        </div>

        <!-- Google title -->
        <div class="field">
            <div class="field-header">
                <input type="checkbox" id="google_title_ck" name="google_title_ck">
                <label for="google_title">Google title</label>
            </div>
            <div class="input-line">
                <input type="text" id="google_title" name="google_title">
                <span class="vd-trash" title="Vider le champ">🗑️</span>
            </div>
        </div>

        <!-- Meta content -->
        <div class="field">
            <div class="field-header">
                <input type="checkbox" id="meta_content_ck" name="meta_content_ck">
                <label for="meta_content">Meta content</label>
            </div>
            <div class="input-line">
                <textarea id="meta_content" name="meta_content"></textarea>
                <span class="vd-trash" title="Vider le champ">🗑️</span>
            </div>
        </div>

<div  >
    <input class="field_img" type="file" name="project_image">
    <span class="vd-trash">🗑️</span>
</div>




        <!-- Child -->
<!-- Ajout d'un child -->
<!-- Ajout d'un child -->
<div class="field">
    <div class="field-header">
        <input type="checkbox" id="child_ck" name="child_ck">
        <label>Ajout d’un child</label>
    </div>

    <div class="child-action">
        <button type="button" class="child-btn">
            ➕ Ajouter un child
        </button>

        <span class="vd-trash" title="Supprimer tous les childs">🗑️</span>
    </div>

<!-- Simulation des childs -->
<div class="child-list">

    <div class="child-item">
        <span class="child-name">Child 1</span>

        <label class="child-switch">
            <input type="checkbox">
            <span class="child-slider"></span>
        </label>
    </div>

    <div class="child-item">
        <span class="child-name">Child 2</span>

        <label class="child-switch">
            <input type="checkbox" checked>
            <span class="child-slider"></span>
        </label>
    </div>

    <div class="child-item">
        <span class="child-name">Child 3</span>

        <label class="child-switch">
            <input type="checkbox">
            <span class="child-slider"></span>
        </label>
    </div>

    <div class="child-item">
        <span class="child-name">Child 4</span>

        <label class="child-switch">
            <input type="checkbox" checked>
            <span class="child-slider"></span>
        </label>
    </div>

</div>

</div>


    </form>

</div>


</body>
</html>
