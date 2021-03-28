<?php
header("Access-Control-Allow-Origin: *");
$servername = "localhost";
$x_position =$_POST["x_position"] ;
$y_position =$_POST["y_position"] ;


$ajout = false;
$filename = 'connexion.php';
if (file_exists($filename)) {
    
    include("connexion.php") ;
    $ajout = true;
} else {
    echo "Le fichier $filename n'existe pas.";
    
}




echo $dbname ;
echo $username ;
echo $password ;
echo "position en x ".$x_position ; 
echo "position en y ".$y_position ; 
$REMOTE_ADDR = $_SERVER['REMOTE_ADDR'];

$conn = new mysqli($servername, $username, $password, $dbname);
// Check connection
if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}

$sql = "INSERT INTO mouse_move (adresse_ip,x_position,y_position )
VALUES ('$REMOTE_ADDR','$x_position','$y_position')";

if ($conn->query($sql) === TRUE) {
  echo "Ajout de la position ok ";
} else {
  echo "Error: " . $sql . "<br>" . $conn->error;
}

$conn->close();


?>