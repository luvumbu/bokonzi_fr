<?php
/**
 * login_js.php — JavaScript de connexion / Login JavaScript
 * FR: Gere l'envoi AJAX du formulaire de connexion et l'animation de succes
 * EN: Handles AJAX login form submission and success animation
 */
?>
<div id="info_index"></div>
<script>
    // FR: Traductions JS injectees depuis PHP / EN: JS translations injected from PHP
    var LOGIN_SUCCESS_MSG = " <?= t('login_success') ?> ✅";

    let i = 0;
    function login_js() {
        if (typeof formData === 'undefined') {
            console.warn('formData n\'existe pas encore !');
            return;
        }

        for (let i = 0; i < formData.identite_tab.length; i++) {
            let id = formData.identite_tab[i][0];
            let value = '';

            let el = document.getElementById(id);
            if (el) {
                if (el.type === 'checkbox') {
                    value = el.checked ? el.value : '0';
                } else if (el.type === 'radio') {
                    let checked = document.querySelector('input[name="' + el.name + '"]:checked');
                    value = checked ? checked.value : '';
                } else {
                    value = el.value;
                }
                formData.identite_tab[i][1] = value;
            }
        }

        console.log('Valeurs à envoyer :', formData.identite_tab);
        formData.push();
        const myTimeout = setTimeout(myGreeting, 250);
        function myGreeting() {

            const xhttp = new XMLHttpRequest();

            xhttp.onload = function() {
                // FR: Injecte la reponse / EN: Inject the response
                document.getElementById("info_index").innerHTML = this.responseText;

                var info_index = document.getElementById("info_index");
                console.log(info_index.innerText[0]);

                var total = info_index.innerText;
                var total2 = LOGIN_SUCCESS_MSG;

                if (info_index.innerText[0] == "✅") {

                    let i = 0;
                    let texte = info_index.innerText;
                    info_index.innerText = '';
                    info_index.style.whiteSpace = 'pre';

                    let interval = setInterval(function() {
                        if (i < texte.length) {
                            info_index.innerText += texte[i];
                            total2 = info_index.innerText;
                            i++;
                        } else {
                            clearInterval(interval);

                            info_index.innerText = total2 + LOGIN_SUCCESS_MSG;

                            const myTimeout = setTimeout(connexion_bdd, 500);

                            function connexion_bdd() {
                                location.reload();
                            }

                        }
                    }, 50);


                } else {
                    // ❌
                }
                i++;
                console.log("i =", i);
            };

            xhttp.onerror = function() {
                console.error("<?= t('error_ajax') ?>");
            };

            xhttp.open("GET", "req_on/info_index.php", true);
            xhttp.send();



        }

    }
</script>