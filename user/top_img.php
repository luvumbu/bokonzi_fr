<?php 
 session_start();
include("../model/class/php/connexion.php");
$name_file=$_SESSION['name_file'] ;
$conn = new mysqli($servername, $username, $password, $dbname);
// Check connection
if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}

$sql = "INSERT INTO user (prenom)
VALUES ('$name_file')";

if ($conn->query($sql) === TRUE) {
  echo "New record created successfully";
} else {
  echo "Error: " . $sql . "<br>" . $conn->error;
}

$conn->close();
session_destroy();

?>