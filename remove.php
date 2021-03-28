<?php
include("link.html");
//echo dirname($_SERVER['SCRIPT_NAME']) ; 
?>

<script>

function remove(){
 
var dbname = document.getElementById("dbname").value;
var username = document.getElementById("username").value;
var password = document.getElementById("password").value;

var ok = new Information("model/class/php/remove_db.php"); 
// création de la classe 
ok.add("dbname", dbname); // ajout de l'information pour lenvoi 
ok.add("username", username); // ajout d'une deuxieme information denvoi  
ok.add("password", password); // ajout d'une deuxieme information denvoi  
console.log(ok.info()); // demande l'information dans le tableau
ok.push(); // envoie l'information au code pkp 



setTimeout(function(){ 
    document.location.reload();

}, 1000);
}
</script>






<?php
$filename = 'model/class/php/connexion.php';

if (file_exists($filename)) {
  ?>

<div class="alert alert-danger" role="alert">
 Entrer les informations pour supprimer le fichier connexion.php 
</div>
<form>
  <div class="form-group">
    <label for="dbname">dbname</label>
    <input   class="form-control" id="dbname" aria-describedby="emailHelp" placeholder="dbname">
    <input   class="form-control" id="username" aria-describedby="emailHelp" placeholder="username">
  </div>
  <div class="form-group">
    <label for="password">Password</label>
    <input type="password" class="form-control" id="password" placeholder="Password">
  </div> 
  <div type="submit" class="btn btn-primary" onclick="remove()">Submit</div>
</form>

<?php 
} else {
 
 ?>
  <div class="alert alert-light" role="alert">
  Aucun fichier a suprimer
</div>
<?php 
}
?>