<link rel="stylesheet" href="../../css.css">
<body>
    <div id="main_container">
        <h1 class="h1_tag">Mon formulaire</h1>
        <div><input type="text" id="mon_id_1" placeholder="dbname">
        </div>
        <div><input type="text" id="mon_id_2" placeholder="table name"></div>
        <div><input type="password" id="mon_id_3" placeholder="password"></div>
        <div id="id_envoyer" onclick="send()" class="envoyer">Envoyer</div>
    </div>
    <script>
        if (typeof window.Information === 'undefined') {
            window.Information = class {
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
                    for (let i = 0; i < this.identite_tab.length; i++) {
                        this.identite.append(this.identite_tab[i][0], this.identite_tab[i][1]);
                    }
                    this.req.open('POST', this.link);
                    this.req.send(this.identite);
                    console.log(this.req);
                }
            };
        }

        if (typeof formData === 'undefined') {
            var formData = new window.Information('Class/traitement.php');
        }

        formData.add('mon_id_1', '');
        formData.add('mon_id_2', '');
        formData.add('mon_id_3', '');
        formData.add('id_envoyer', '');
        console.log('Valeurs ajoutées automatiquement :', formData.info());
    </script>
    <script>
        if (typeof formData !== 'undefined') {
            formData.push();
        } else {
            console.warn('La variable formData n\'existe pas encore.');
        }
    </script>


    <script>
        function send() {
            console.log(formData);


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


        }
    </script>


</body>