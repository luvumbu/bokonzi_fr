<?php
 session_start(); 
 header("Access-Control-Allow-Origin: *");
 $REMOTE_ADDR= $_SERVER['REMOTE_ADDR'];
 include("../model/class/php/connexion.php") ; 
 $file_name=$_SESSION["file_name"] ;



 
$conn = new mysqli($servername, $username, $password, $dbname);
// Check connection
if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}

$sql = "INSERT INTO picture (name_picture,ip)
VALUES ('$file_name','$REMOTE_ADDR')";

if ($conn->query($sql) === TRUE) {
  echo "New record created successfully";
} else {
  echo "Error: " . $sql . "<br>" . $conn->error;
}

$conn->close();
 
?>