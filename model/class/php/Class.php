<?php 
$affiche_div=false; 
$config_=false;
$filename = 'model/class/php/connexion.php';
if (!file_exists($filename)) {
   // echo "Le fichier $filename existe pas";
    include("config.php"); // demande un tableau des valeurs
   

    ?>
 
    <?php 
    
} else {
       include("connexion.php");
       $affiche_div =true;
       $config_=true;


 
  //  echo "Le fichier $filename n'existe pas.";
}
?>