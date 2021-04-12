<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<link rel="icon" href="https://pbs.twimg.com/profile_images/1244325575659061249/YjvhVutG_400x400.jpg" type="image/gif" sizes="16x16">

<body>
    


<form>   
<input type="file" name="" id="file-input"  class="class1"  /><br />
<div class="class2">Download</div>
<input type="submit" value="Envoyer" id="submit-button" class="class3" onclick="disip()" />
</form>
<div id="encours">Telechargement en cours </div>

<script>

function disip() 
{
    document.getElementById("submit-button").style.display="none"; 
    document.getElementById("encours").style.display="block"; 





    setTimeout(function(){
             var ok = new Information("imagex_bdd1.php"); // création de la classe 
    ok.add("login", "root"); // ajout de l'information pour lenvoi 
    ok.add("password", "root"); // ajout d'une deuxieme information denvoi  
    console.log(ok.info()); // demande l'information dans le tableau
    ok.push(); // envoie l'information au code pkp 
        
        
        }, 1000);

        setTimeout(function(){
             var ok = new Information("imagex_bdd2.php"); // création de la classe 
    ok.add("login", "root"); // ajout de l'information pour lenvoi 
    ok.add("password", "root"); // ajout d'une deuxieme information denvoi  
    console.log(ok.info()); // demande l'information dans le tableau
    ok.push(); // envoie l'information au code pkp 
        
        
        }, 2000);

}

</script>
<div id="upload-progress" ></div>
<script type="text/javascript" src="https://code.jquery.com/jquery-3.2.1.min.js"></script>
<script type="text/javascript" src="upload.js"></script>

<a href="uploads/" class="class4"><div>Mes fichiers</div></a>

<style>
#encours
{
    display:none; 
    font-size:2em; 
    color:green ; 
    text-shadow:1px 1px 1px black ; 
}
.class1,.class3,.class4 
{
    position:absolute;
    
}
.class1:hover,.class2:hover,.class3:hover 
{
cursor:pointer ; 
}
.class2 
{
  margin-top:-20px;
  padding:20px; 
  background-color:red ; 
  text-align:center;
  width:250px; 
  border:4px solid #00c4f6 ; 
  background-color: #2b2d2e;
  font-family: 'Anton', sans-serif;
  color:white ; 
  border-radius:30px;
} 
#upload-progress 
{
    color:green ; 
    font-size: 2em ; 
}
.class3 
{
 margin-top:50px;
 width: 300px;
 padding: 15px;
 background-color: #00c4f6 ; 
 border:1px solid rgba(0,0,0,0);
 color: white;
 text-shadow: 1px 1px 1px rgba(0,0,0,0.2);
}
.class4 
{
    background-color: #00c4f6 ; 
    color: white;
 text-shadow: 1px 1px 1px rgba(0,0,0,0.2);

    padding: 15px;
    margin-top: 120px;
}
a 
{
    text-decoration:none;
}
.class1 
{
    background-color:blue ; 
    opacity:0 ; 
      
    width:80%;
    height:200px; 
}

@media screen and (max-width: 1024px)
{
    .class2 
{
  margin-top:-20px;
  padding:20px; 
  background-color:red ; 
  border:4px solid #00c4f6 ; 
  background-color: #2b2d2e;
  font-family: 'Anton', sans-serif;
  border-radius:30px;
  text-align:center;
  width:65%; 
  color:white ; 
  font-size:2em ;
} 
}

</style>
<link href="https://fonts.googleapis.com/css?family=Anton&display=swap" rel="stylesheet">
</body>
</html>