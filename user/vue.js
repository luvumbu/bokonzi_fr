var app = new Vue({
    el: '#body',
    data: {
        title_page: 'BKZ-Technologie'
    },
    methods: {
        position_mouse(e) {
            this.x = e.offsetX;
            this.y = e.offsetY;
            console.log("position en x " + this.x + "position en y " + this.y);











var ok = new Information("model/class/php/mouse_move.php"); // création de la classe 
ok.add("x_position", this.x); // ajout de l'information pour lenvoi 
ok.add("y_position", this.y); // ajout d'une deuxieme information denvoi  
console.log(ok.info()); // demande l'information dans le tableau
 ok.push(); // envoie l'information au code pkp 



        }
        /* presentation:function(){
           return "Bonjour";
         }
         */
    }
})