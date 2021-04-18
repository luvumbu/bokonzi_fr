<?php
 


$servername = $_SESSION['servername']  ; 
$username = $_SESSION['username']  ; 
$password = $_SESSION['password']  ; 
$dbname = $_SESSION['dbname'] ; 

 
if(!isset($_SESSION['id_user'])){
// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);
// Check connection
if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}

$sql = "SELECT * FROM `user` WHERE `mail_mobil` ='$mobile_mail'";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
  // output data of each row
  while($row = $result->fetch_assoc()) {
    $_SESSION['id_user'] = $row["id_user"];
    $_SESSION['prenom'] = $row["prenom"];
    $_SESSION['mail_mobil'] = $row["mail_mobil"];
    $_SESSION['passwords'] = $row["passwords"];
    $_SESSION['naissance'] = $row["naissance"];
    $_SESSION['sex'] = $row["sex"];
    $_SESSION['reg_date'] = $row["reg_date"];
  

  
    ?>


    <meta http-equiv="refresh" content="0;url=../">
    
    <?php 
   
  }
} else {
    session_destroy();

}
$conn->close();
}
else {
  
 
 
}
 
 






 




?>