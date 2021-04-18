 <div id="img_test">


<?php 


 
include("liste_extension.php"); 

 

if(isset( $_SESSION['id_user'])){

  $id_user =  $_SESSION['id_user'] ; 
  $conn = new mysqli($servername, $username, $password, $dbname);
// Check connection
if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}

$sql = 'SELECT * FROM `folder` WHERE `id_user` ='.$id_user.' ';
$result = $conn->query($sql);

if ($result->num_rows > 0) {
  // output data of each row
  while($row = $result->fetch_assoc()) {
  $name_extension=  $row["name_extension"] ; 



 
if (in_array($name_extension, $extension_img)) {
    $name_picture = $row["name_picture"] ; 
    echo '<div>' ;
    echo '<a href="uploads/'.$name_picture.'">'; 
    echo ' <img src="uploads/'.$name_picture.'" alt="" srcset="">'; 
    echo '</a>';
    echo '</div>' ;
}
 
  }
} else {
  echo "0 results";
}
$conn->close();

}
else {
  session_destroy();
  header("Refresh:0; url=index.php");
}
 



?>

</div>

<style>
    img {
        
        
    }
    #img_test img {
            width:14em ; 
         background-color:red ; 
    }
    #img_test {
        display:flex ;
         margin-top:150px; 
         justify-content: space-around;
         flex-wrap: wrap;
         width: 60%: 
   
    }
</style>
