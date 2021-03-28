function bdd_exe_test(){
    var dbname=     document.getElementById("dbname").value; 
    var password=   document.getElementById("password").value; 
    var username=   document.getElementById("username").value; 
    var ok = new    Information("model/class/php/bdd_exe_test.php"); // création de la classe 
    ok.add("dbname", dbname); // ajout de l'information pour lenvoi 
    ok.add("password", password); // ajout d'une deuxieme information denvoi  
    ok.add("username", username); // ajout d'une deuxieme information denvoi  
    console.log(ok.info()); // demande l'information dans le tableau
    ok.push(); // envoie l'information au code pkp 
    setTimeout(function(){
      document.location.reload(true);
      
      }, 250);
    }