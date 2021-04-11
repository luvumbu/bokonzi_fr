

<div class="display">
    <?php
    $dir_nom = '.'; // dossier listé (pour lister le répertoir courant : $dir_nom = '.'  --> ('point')
    $dir = opendir($dir_nom) or die('Erreur de listage : le répertoire n\'existe pas'); // on ouvre le contenu du dossier courant
    $fichier = array(); // on déclare le tableau contenant le nom des fichiers
    $dossier = array(); // on déclare le tableau contenant le nom des dossiers
    while ($element = readdir($dir)) {
        if ($element != '.' && $element != '..') {
            if (!is_dir($dir_nom . '/' . $element)) {
                $fichier[] = $element;
            } else {
                $dossier[] = $element;
            }
        }
    }
    if (!empty($fichier)) {
        sort($fichier); // pour le tri croissant, rsort() pour le tri décroissant

        foreach ($fichier as $lien) {
      
            $valeurf = "";
            $verif = false;

            $taille = strlen($lien);
            for ($i = 0; $i < $taille; $i++) {
          
                if ($lien[$i] == ".") {
                    $verif = true;
                   
                }
                if ($verif == true &&  $lien[$i] != ".") {
                    $valeurf = $valeurf . $lien[$i];
                }
            }
 
            if ($valeurf == "tiff" || $valeurf == "jpg" || $valeurf == "gif" || $valeurf == "png") {
    ?>
                <img src="<?php echo $lien ?>" alt="" srcset="">
    <?php
            }
        }
    }
    ?>


</div>
<style>
    img {
        width: 300px;
        padding: 15px;
    }

    .display {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
    }
</style>