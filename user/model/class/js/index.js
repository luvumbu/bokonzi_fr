function log_out(){  
    window.location.href = "model/class/php/log_out.php";
  }
  function folde_plus(_this){

    document.getElementById("add_files").className="" ; 
  }
  function reload(){
    document.location.reload();
  }
  function loadDoc(_this) {
    document.getElementById("add_files").className="add_files_off" ; 
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        document.getElementById("div_folder").innerHTML =
        this.responseText;
      }
    };
    xhttp.open("GET", "contained/"+_this.title+".html", true);
    xhttp.send();
  }
  
  function header_button(_this)
  {
  
    
    /*
    Voir contained 
doc_width
musique_width
picture_width
video_play_width
*/

  
    document.getElementById("add_files").className="add_files_off" ; 
    var mypagediv  = document.getElementById(_this.id) ; 
    var parentElId = mypagediv.parentElement.id; 
    var folder_parent = document.getElementById(parentElId) ; 
    var parentElLength = document.getElementById(parentElId).childElementCount ; 
  
    document.getElementById("header_call").innerHTML="sa marche"; 


 
    
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        document.getElementById("header_call").innerHTML =
        this.responseText;
      }
    };
    xhttp.open("GET", "contained/folder_"+_this.id+".php", true);
    xhttp.send();














    

    /* 
      doc_width
      picture_width
      video_play_width
      musique_width



    */
  
   for(var i = 1 ; i < parentElLength-1 ; i++ ){
   
    if(folder_parent.children[i].id!=_this.id ){
      document.getElementById(folder_parent.children[i].id).style.display="none";
    }
    else{
      document.getElementById(folder_parent.children[i].id).style.opacity="0.1";
    }
    document.getElementById(folder_parent.children[parentElLength-1].id).id="plus_"+_this.id ;
    document.getElementById(folder_parent.children[parentElLength-1].id).style.display="block";
   
   }
   
  
    
    
  }