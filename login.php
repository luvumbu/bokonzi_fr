<?php
session_start(); 
header("Access-Control-Allow-Origin: *");
include("model/class/php/connexion.php") ;  
$mail_mobil =$_POST["mail_mobil"] ;
$passwords =$_POST["passwords"] ;


 



 

$conn = new mysqli($servername, $username, $password, $dbname);
// Check connection
if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}

$sql = 'SELECT * FROM `user` WHERE `mail_mobil`="'.$mail_mobil.'" AND `passwords`="'.$passwords.'"';
$result = $conn->query($sql);

if ($result->num_rows > 0) {
  // output data of each row
  while($row = $result->fetch_assoc()) {
     
    $_SESSION['user_login']= true; 
    $_SESSION['prenom'] = $row["prenom"] ;  
    $_SESSION['nom'] =$row["nom"]  ;
    $_SESSION['mail_mobil'] =$row["mail_mobil"] ;
    $_SESSION['passwords'] =$row["passwords"] ;
    $_SESSION['naissance'] =$row["naissance"];
    $_SESSION['reg_date'] =$row["reg_date"];

  }
} else {
  echo "0 results";
}
$conn->close();
 
?>