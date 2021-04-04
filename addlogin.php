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
// 


$mail_mobil = $mobile_mail; 









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
     
     


  }
} else {

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
  $_SESSION['user_login']= true; 


$_SESSION['prenom']      =             $prenom   ;
$_SESSION['mobile_mail'] =             $mobile_mail   ;
$_SESSION['passwords']   =             $passwords   ;
$_SESSION['naissance']   =             $naissance   ;




  if($REMOTE_ADDR=="::1" || $REMOTE_ADDR=="127.0.0.1" ){
    echo "Mon adreesse est en local"; 
    echo $_SERVER['REMOTE_ADDR']; 
}
else {
     




  $to      = $mobile_mail;
  $subject = 'le sujet';
  $message = 'Bonjour !';
  $headers = 'From: contact@bokonzi.com' . "\r\n" .
  'Reply-To: contact@bokonzi.com' . "\r\n" .
  'X-Mailer: PHP/' . phpversion();

  mail($to, $subject, $message, $headers);







}

















} else {
  echo "Error: " . $sql . "<br>" . $conn->error;
}

$conn->close();
}
$conn->close();
 














































?>