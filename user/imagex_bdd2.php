<?php
 session_start(); 
 header("Access-Control-Allow-Origin: *");
 $REMOTE_ADDR= $_SERVER['REMOTE_ADDR'];
 include("../model/class/php/connexion.php") ; 
 $file_name=$_SESSION["file_name_bdd"] ;

 $id_user = $_SESSION["id_user"] ;
 $name_extension =$_SESSION["name_extension"] ; 
 
 
$conn = new mysqli($servername, $username, $password, $dbname);
// Check connection
if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}

$sql = "INSERT INTO folder (name_picture,ip,id_user,name_extension)
VALUES ('$file_name','$REMOTE_ADDR',' $id_user','$name_extension')";

if ($conn->query($sql) === TRUE) {
  echo "New record created successfully";
} else {
  echo "Error: " . $sql . "<br>" . $conn->error;
}

$conn->close();
 
?>