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
<input  onclick="file_name()" type="file" name="" id="file-input"  class="class1"  /><br />
<div class="class2"  >Download</div>
<input type="submit" value="Envoyer" id="submit-button" class="class3" onclick="disip()" />
</form>
<div id="encours">Telechargement en cours </div>

 
<div id="upload-progress" ></div>
<script type="text/javascript" src="https://code.jquery.com/jquery-3.2.1.min.js"></script>
<script type="text/javascript" src="upload.js"></script>

<a href="uploads/" class="class4"><div>Mes fichiers</div></a>

<link rel="stylesheet" href="imagex.css">
<link href="https://fonts.googleapis.com/css?family=Anton&display=swap" rel="stylesheet">

<script >
    function file_name()
    {
             var ok = new Information("imagex_name_file.php"); // création de la classe 

      ok.add("login", "root"); // ajout de l'information pour lenvoi 
ok.add("password", "root"); // ajout d'une deuxieme information denvoi  
 console.log(ok.info()); // demande l'information dans le tableau
 ok.push(); // envoie l'information au code pkp 
    }

</script>

<script src="imagex.js"></script>
</body>
</html>