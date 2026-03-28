<?php
/**
 * effacement.php — Bouton de deconnexion (info_exe) / Logout button (info_exe)
 * FR: Bouton pour effacer la session et se deconnecter (version info_exe)
 * EN: Button to clear session and log out (info_exe version)
 */
?>
<script>
    class Information {
        constructor(link) {
            this.link = link;
            this.identite = new FormData();
            this.req = new XMLHttpRequest();
            this.identite_tab = [];
        }
        info() {
            return this.identite_tab;
        }
        add(info, text) {
            this.identite_tab.push([info, text]);
        }
        push() {
            for (var i = 0; i < this.identite_tab.length; i++) {
                console.log(this.identite_tab[i][1]);
                this.identite.append(this.identite_tab[i][0], this.identite_tab[i][1]);
            }
            this.req.open("POST", this.link);
            this.req.send(this.identite);
            console.log(this.req);
        }
    }
    function unlink_on() {
        var ok = new Information("info_exe/unlink_off.php"); // FR: creation de la classe / EN: class creation
        console.log(ok.info()); // FR: demande l'information / EN: request information
        ok.push(); // FR: envoie l'information au PHP / EN: send information to PHP
        const myTimeout = setTimeout(myGreeting, 200);
        function myGreeting() {
          location.reload();
        }

    }
</script>
<div onclick="unlink_on()" class="effacer"><?= t('btn_delete') ?></div>