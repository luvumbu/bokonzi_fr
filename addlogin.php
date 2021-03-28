<?php
session_start();
header("Access-Control-Allow-Origin: *");
$servername = "localhost";
include("model/class/php/connexion.php"); 
$prenom =$_POST["prenom"] ;
$nom =$_POST["nom"] ;
$mobile_mail =$_POST["mobile_mail"] ;
$passwords =$_POST["password"] ;
$naissance =$_POST["naissance"] ;


$_SESSION['naissance'] = $_POST["naissance"] ;

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);
// Check connection
if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}

$sql = "INSERT INTO user (prenom, nom , mail_mobil , passwords , naissance )
VALUES ('$prenom ', '$nom', '$mobile_mail','$passwords','$naissance ')";

if ($conn->query($sql) === TRUE) {
  echo "New record created successfully";
} else {
  echo "Error: " . $sql . "<br>" . $conn->error;
}

$conn->close();

?>