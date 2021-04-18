
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
