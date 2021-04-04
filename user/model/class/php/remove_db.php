<?php 
 
header("Access-Control-Allow-Origin: *");
$servername = "localhost";
$dbname = $_POST["dbname"];
$username = $_POST["username"];
$password = $_POST["password"];

//$password = $_POST["password";
//echo $password  ; 


 
try {
    $conn = new PDO("mysql:host=$servername;dbname=".$dbname, $username, $password);
    // set the PDO error mode to exception
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Connected successfully";
    $fh = fopen('test.html', 'a');
    fwrite($fh, '<h1>Hello world!</h1>');
    fclose($fh);

    unlink('connexion.php');

  } catch(PDOException $e) {
 
    //echo "Connection failed: " . $e->getMessage();
  }
 


 

 


?>