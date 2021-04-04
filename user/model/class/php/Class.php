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

  try {

    $conn = new PDO("mysql:host=$servername;dbname=".$dbname, $username, $password);
    // set the PDO error mode to exception
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
   // echo "Connected successfully";
  } catch(PDOException $e) {
    //echo "Connection failed: " . $e->getMessage();
     
    unlink('model/class/php/connexion.php');
 
  }
 
  //  echo "Le fichier $filename n'existe pas.";
}
?>