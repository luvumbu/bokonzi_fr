<?php
session_start(); 
header("Access-Control-Allow-Origin: *");
$dbname= $_POST["dbname"];
$username= $_POST["username"];
$password= $_POST["password"];
/*
  //********************************************
  //*informations envoye a l'aide du formulaire*
  //*si le fichier connexion.php n'existe pas  *
  //******************************************** 
    */ 

$servername = "localhost";
$n="\n";
$debut="<?php".$n;
$fin="?>".$n;

// nom du fichier courant
$nom_file = "connexion.php";
// fin du fichier courant 
 



//$servername = "localhost";
//$username = "u481158665_facebook_clone";
//$password = "v3p9r3e@59A";
//$dbname = "u481158665_facebook_clone";


try {
 // debut du test 
                      // Create connection
                      $conn = new mysqli($servername, $username, $password, $dbname);
                      // Check connection
                      if ($conn->connect_error) {
                        die("Connection failed: " . $conn->connect_error);
                      }

                      // sql to create table
                      $sql = "CREATE TABLE user (
                      id_user	 INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                      prenom VARCHAR(30) NOT NULL,
                      nom VARCHAR(30) NOT NULL,
                      mail_mobil VARCHAR(50),
                      passwords VARCHAR(50),
                      naissance VARCHAR(50),
                      reg_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                      )";

                      if ($conn->query($sql) === TRUE) {
                        echo "Table user created successfully";
                      } else {
                        echo "Error creating table: " . $conn->error;
                      }

                      $conn->close();

 // fin du test 
} catch (Exception $e) {
  echo 'Exception reçue : ',  $e->getMessage(), "\n";
}
 


// 0000000000000000000000000000
try {
  // debut du test 
                       // Create connection
                       $conn = new mysqli($servername, $username, $password, $dbname);
                       // Check connection
                       if ($conn->connect_error) {
                         die("Connection failed: " . $conn->connect_error);
                       }
 
                       // sql to create table
                       $sql = "CREATE TABLE picture (
                       id_picture	 INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                       id_user VARCHAR(30) NOT NULL,
                       ip VARCHAR(30) NOT NULL,
                       name_picture VARCHAR(60) NOT NULL,
                       reg_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                       )";
 
                       if ($conn->query($sql) === TRUE) {
                         echo "Table user created successfully";
                       } else {
                         echo "Error creating table: " . $conn->error;
                       }
 
                       $conn->close();
 
  // fin du test 
 } catch (Exception $e) {
   echo 'Exception reçue : ',  $e->getMessage(), "\n";
 }




// 1111111111111111111111111111






try {
  // debut du test 
                       // Create connection
                       $conn = new mysqli($servername, $username, $password, $dbname);
                       // Check connection
                       if ($conn->connect_error) {
                         die("Connection failed: " . $conn->connect_error);
                       }
 
                       // sql to create table
                       $sql = "CREATE TABLE mouse_move (
                       id_mouse_move	 INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                       adresse_ip VARCHAR(30) NOT NULL,
                       x_position VARCHAR(30) NOT NULL,
                       y_position VARCHAR(50),
                       reg_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                       )";
 
                       if ($conn->query($sql) === TRUE) {
                         echo "Table mouse_move created successfully";
                       } else {
                         echo "Error creating table: " . $conn->error;
                       }

                       // !!!!!!!!!!!!!!!!!!!!!!!!!!





                       //000000000000000000000000000000
 
                       $conn->close();
 
  // fin du test 
 } catch (Exception $e) {
   echo 'Exception reçue : ',  $e->getMessage(), "\n";
 }








































try {
  $conn = new PDO("mysql:host=$servername;dbname=".$dbname, $username, $password);
  // set the PDO error mode to exception
  $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  echo "Connected successfully";
  $texte=   $debut.$n.'$dbname="'.$dbname.'";'.$n.'$username="'.$username.'";'.$n.'$password="'.$password.'";'.$n.'$servername="'.$servername.'";'.$n.$n.$fin;

  // création du fichier
  $f = fopen($nom_file, "x+");
  // écriture
  fputs($f, $texte );
  // fermeture
  fclose($f);

} catch(PDOException $e) {
  echo "une erreur";
  echo "Connection failed: " . $e->getMessage();
}
?>