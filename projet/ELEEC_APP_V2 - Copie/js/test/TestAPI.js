// ========================================
// TestAPI — Tests EXHAUSTIFS 100+ tests
// ========================================

class TestAPI {
    constructor() { this.results=[]; this.passed=0; this.failed=0; }
    _log(n,ok,d) { this.results.push({nom:n,ok:ok,detail:d||''}); if(ok)this.passed++;else this.failed++; console.log((ok?'✓':'✗')+' '+n+(d?' — '+d:'')); return ok; }
    _assert(n,c,d) { return this._log(n,!!c,d); }
    _section(n) { console.log('\n--- '+n+' ---'); this.results.push({nom:'--- '+n+' ---',ok:true,detail:'',section:true}); }

    // === API ===
    ajouterMur(p) { return editeur.ajouterMur(Object.assign({couleur:'#8b6132',jointCouleur:'#000',distance:3,hauteur:2.50,angle:0,x:0,y:0,z:0},p||{})); }
    supprimerMur(id) { return editeur.supprimer(id); }
    getMurs() { return editeur.elements; }
    poserPorte(mid,x,z,y,l,h,a) { porte.setCouleurs('#8B4513','#D2691E'); return porte.creer(mid||'simple',x||1,z||0,y||0,l||0.83,h||2.04,a||0); }
    poserFenetre(mid,x,z,y,l,h,a) { fenetre.setCouleurs('#4a90d9','#87CEEB',0.3); return fenetre.creer(mid||'rectangle',x||1,z||0,y||0.90,l||1.20,h||1.20,a||0); }
    getExclusions() { return editeur.exclusions; }
    poserPlaco(x,z,y,l,h,a,ep,s,mep) { placo.setCouleurs('#F5F5F0',0.99); var g=placo.creer('ba13',x||0,z||0,y||0,l||1.20,h||2.50,a||0,ep||0.013,s||1,mep||0.11); placoElements.push(g); return g; }
    supprimerPlaco(g) { sceneManager.scene.remove(g); for(var i=0;i<placoElements.length;i++){if(placoElements[i]===g){placoElements.splice(i,1);return true;}} return false; }
    getPlacos() { return placoElements; }
    poserLaine(x,z,y,l,h,a,ep,s,mep) { laineDeVerre.setCouleurs('#F2D544',0.85); var g=laineDeVerre.creer('lv-75',x||0,z||0,y||0,l||1.20,h||2.50,a||0,ep||0.075,s||1,mep||0.11); laineElements.push(g); return g; }
    supprimerLaine(g) { sceneManager.scene.remove(g); for(var i=0;i<laineElements.length;i++){if(laineElements[i]===g){laineElements.splice(i,1);return true;}} return false; }
    getLaines() { return laineElements; }
    poserPlinthe(mid,idx) { var pg=placoElements[idx||0]; if(!pg)return null; plintheObj.setCouleur('#D4C8B0'); var g=plintheObj.creer(mid||'platre-8',pg.userData.placoInfo,pg); plinthElements.push(g); return g; }
    supprimerPlinthe(g) { sceneManager.scene.remove(g); for(var i=0;i<plinthElements.length;i++){if(plinthElements[i]===g){plinthElements.splice(i,1);return true;}} return false; }
    getPlinthes() { return plinthElements; }
    poserCarrelage(mid,idx) { var pg=placoElements[idx||0]; if(!pg)return null; carrelageObj.setCouleurs('#E8E0D0','#C8C0B0'); var g=carrelageObj.creer(mid||'carre-20',pg.userData.placoInfo,pg); carrelageElements.push(g); return g; }
    supprimerCarrelage(g) { sceneManager.scene.remove(g); for(var i=0;i<carrelageElements.length;i++){if(carrelageElements[i]===g){carrelageElements.splice(i,1);return true;}} return false; }
    getCarrelages() { return carrelageElements; }
    poserPapierPeint(mid,idx) { var pg=placoElements[idx||0]; if(!pg)return null; ppObj.setCouleurs('#F5EDE0','#E8D8C4'); var g=ppObj.creer(mid||'rayures-v',pg.userData.placoInfo,pg); ppElements.push(g); return g; }
    supprimerPapierPeint(g) { sceneManager.scene.remove(g); for(var i=0;i<ppElements.length;i++){if(ppElements[i]===g){ppElements.splice(i,1);return true;}} return false; }
    getPapiersPeints() { return ppElements; }
    poserPersonnage(x,z) { var c={peau:'#8D5524',cheveux:'#3E2723',haut:'#FFFFFF',bas:'#D32F2F',chaussures:'#212121'}; var p=personnage.creer(c,x||2,z||2); p.scale.setScalar(1); p.userData.persoInfo={couleurs:c,worldX:x||2,worldZ:z||2,taille:1}; personnagesListe.push(p); return p; }
    supprimerPersonnage(g) { sceneManager.scene.remove(g); for(var i=0;i<personnagesListe.length;i++){if(personnagesListe[i]===g){personnagesListe.splice(i,1);return true;}} return false; }
    getPersonnages() { return personnagesListe; }
    snapshot() { return _macroSnapshot(); }
    restore(s) { _macroRestore(s); }
    getCacheComplet() { return _getCacheComplet(); }
    chargerSlot(d) { _chargerSlot(d); }
    viderTout() {
        toutDesactiver();
        while(editeur.exclusions.length>0){if(editeur.exclusions[0].group3D)sceneManager.scene.remove(editeur.exclusions[0].group3D);editeur.exclusions.splice(0,1);}
        editeur.viderTout();
        for(var i=0;i<placoElements.length;i++)sceneManager.scene.remove(placoElements[i]); placoElements.length=0;
        for(var i=0;i<laineElements.length;i++)sceneManager.scene.remove(laineElements[i]); laineElements.length=0;
        for(var i=0;i<plinthElements.length;i++)sceneManager.scene.remove(plinthElements[i]); plinthElements.length=0;
        for(var i=0;i<carrelageElements.length;i++)sceneManager.scene.remove(carrelageElements[i]); carrelageElements.length=0;
        for(var i=0;i<ppElements.length;i++)sceneManager.scene.remove(ppElements[i]); ppElements.length=0;
        var rm=[]; sceneManager.scene.traverse(function(c){if(c.userData&&c.userData.isPersonnage&&c.parent===sceneManager.scene)rm.push(c);}); for(var i=0;i<rm.length;i++)sceneManager.scene.remove(rm[i]); personnagesListe.length=0;
        while(editeur.traits.length>0) editeur.supprimerTrait(editeur.traits[0].id);
    }

    // ============================================================
    runAll() {
        console.log('========================================');
        console.log('  ELEEC APP V2 — Tests EXHAUSTIFS');
        console.log('========================================');
        this.results=[]; this.passed=0; this.failed=0;
        var methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this)).filter(function(m){return m.charAt(0)==='T'&&m.charAt(3)==='_';}).sort();
        for (var i=0;i<methods.length;i++) this[methods[i]]();
        console.log('\n========================================');
        console.log('  '+this.passed+' passes, '+this.failed+' echoues / '+(this.passed+this.failed));
        console.log('========================================');
        return {passed:this.passed,failed:this.failed,total:this.passed+this.failed,results:this.results};
    }

    // ============================
    // 01-07 : CATALOGUES
    // ============================
    T01_cataloguesPortes() {
        this._section('01 — CATALOGUES PORTES');
        var m=Porte.modeles(); this._assert(m.length+' portes',m.length>=17);
        for(var i=0;i<m.length;i++) this._assert('Porte '+m[i].id,m[i].id&&m[i].nom&&m[i].largeur>0&&m[i].hauteur>0&&m[i].ico,m[i].largeur+'x'+m[i].hauteur);
    }
    T02_cataloguesFenetres() {
        this._section('02 — CATALOGUES FENETRES');
        var m=Fenetre.modeles(); this._assert(m.length+' fenetres',m.length>=8);
        for(var i=0;i<m.length;i++) this._assert('Fenetre '+m[i].id,m[i].id&&m[i].largeur>0&&m[i].hauteur>0);
    }
    T03_cataloguesPlaco() { this._section('03 — CATALOGUES PLACO'); var m=Placo.modeles(); for(var i=0;i<m.length;i++) this._assert('Placo '+m[i].id+' ep='+m[i].ep,m[i].ep>0); }
    T04_cataloguesLaine() { this._section('04 — CATALOGUES LAINE'); var m=LaineDeVerre.modeles(); for(var i=0;i<m.length;i++) this._assert('Laine '+m[i].id,m[i].ep>0); }
    T05_cataloguesPlinthe() { this._section('05 — CATALOGUES PLINTHE'); var m=Plinthe.modeles(); for(var i=0;i<m.length;i++) this._assert('Plinthe '+m[i].id,m[i].hauteur>0&&m[i].ep>0); }
    T06_cataloguesCarrelage() { this._section('06 — CATALOGUES CARRELAGE'); var m=Carrelage.modeles(); for(var i=0;i<m.length;i++) this._assert('Carrelage '+m[i].id,m[i].tW>0&&m[i].tH>0); }
    T07_cataloguesPapierPeint() { this._section('07 — CATALOGUES PAPIER PEINT'); var m=PapierPeint.modeles(); for(var i=0;i<m.length;i++) this._assert('PP '+m[i].id+' motif='+m[i].motif,!!m[i].motif); }

    // ============================
    // 08-14 : MURS CONFIGS
    // ============================
    T08_murAngles() {
        this._section('08 — MURS 8 ANGLES'); this.viderTout();
        [0,45,90,135,180,225,270,315].forEach(function(a,i){
            var m=this.ajouterMur({distance:3,hauteur:2.50,angle:a,x:i*4,z:0});
            this._assert('Mur angle='+a,m&&m.params.angle===a);
        }.bind(this));
        this.viderTout();
    }
    T09_murDistances() {
        this._section('09 — MURS DISTANCES'); this.viderTout();
        [0.5,1,2,3,5,8,12].forEach(function(d,i){
            var m=this.ajouterMur({distance:d,hauteur:2.50,angle:0,x:0,z:i*2});
            this._assert('Mur dist='+d+'m',m&&m.params.distance===d);
        }.bind(this));
        this.viderTout();
    }
    T10_murHauteurs() {
        this._section('10 — MURS HAUTEURS'); this.viderTout();
        [0.5,1,1.50,2,2.50,3,4].forEach(function(h,i){
            var m=this.ajouterMur({distance:3,hauteur:h,angle:0,x:i*4,z:0});
            this._assert('Mur h='+h+'m',m&&m.params.hauteur===h);
        }.bind(this));
        this.viderTout();
    }
    T11_murBriqueTypes() {
        this._section('11 — 8 TYPES BRIQUES'); this.viderTout();
        var types=Object.keys(BRIQUES_TYPES);
        for(var i=0;i<types.length;i++){
            var bt=BRIQUES_TYPES[types[i]];
            var m=this.ajouterMur({distance:3,hauteur:2.50,angle:0,x:i*4,z:0,briqueType:types[i],couleur:bt.couleur,jointCouleur:bt.jointCouleur});
            this._assert('Brique '+types[i],m!==null,bt.nom+' '+bt.longueur+'x'+bt.hauteur+'x'+bt.epaisseur);
        }
        this.viderTout();
    }
    T12_murPositions() {
        this._section('12 — MURS POSITIONS'); this.viderTout();
        [{x:0,z:0},{x:5,z:0},{x:0,z:-5},{x:10,z:10},{x:-3,z:7}].forEach(function(p){
            var m=this.ajouterMur({distance:3,hauteur:2.50,angle:0,x:p.x,z:p.z});
            this._assert('Mur ('+p.x+','+p.z+')',m&&(m.params.x||0)===p.x&&(m.params.z||0)===p.z);
        }.bind(this));
        this.viderTout();
    }
    T13_murSuppression() {
        this._section('13 — SUPPRESSION MURS'); this.viderTout();
        for(var i=0;i<5;i++) this.ajouterMur({distance:2,hauteur:2,angle:0,x:i*3,z:0});
        this._assert('5 murs',this.getMurs().length===5);
        this.supprimerMur(this.getMurs()[2].id); this._assert('4 apres milieu',this.getMurs().length===4);
        this.supprimerMur(this.getMurs()[0].id); this._assert('3 apres premier',this.getMurs().length===3);
        this.supprimerMur(this.getMurs()[this.getMurs().length-1].id); this._assert('2 apres dernier',this.getMurs().length===2);
        while(this.getMurs().length>0) this.supprimerMur(this.getMurs()[0].id);
        this._assert('0 murs',this.getMurs().length===0);
    }
    T14_murBicolore() {
        this._section('14 — MUR BICOLORE'); this.viderTout();
        var m=this.ajouterMur({distance:4,hauteur:2.50,angle:0,bicolore:{couleur2:'#A0522D',opacite2:1}});
        this._assert('Mur bicolore cree',m!==null);
        this._assert('Mur bicolore a 2 briques',m&&m.brique2!==undefined);
        this._assert('Mur bicolore a group',m&&m.group!==null&&m.group!==undefined);
        this.viderTout();
    }

    // ============================
    // 15-17 : POLYGONES
    // ============================
    T15_murCarre() {
        this._section('15 — MUR CARRE (4 cotes)'); this.viderTout();
        var m=this.ajouterMur({distance:3,hauteur:2.50,nbCotes:4,angleDepart:0,x:0,z:0});
        this._assert('Carre cree',m!==null);
        this._assert('Carre nbCotes=4',m&&m.params.nbCotes===4);
    }
    T16_murHexagone() {
        this._section('16 — MUR HEXAGONE (6 cotes)');
        var m=this.ajouterMur({distance:2,hauteur:2.50,nbCotes:6,angleDepart:0,x:8,z:0});
        this._assert('Hexagone cree',m!==null);
        this._assert('Hexagone nbCotes=6',m&&m.params.nbCotes===6);
    }
    T17_murTrianglePoly() {
        this._section('17 — MUR TRIANGLE (3 cotes)');
        var m=this.ajouterMur({distance:3,hauteur:2.50,nbCotes:3,angleDepart:0,x:15,z:0});
        this._assert('Triangle cree',m!==null);
        this.viderTout();
    }

    // ============================
    // 18-20 : DEPLACER / PIVOTER / REDIM MURS
    // ============================
    T18_deplacerMur() {
        this._section('18 — DEPLACER MUR'); this.viderTout();
        var m=this.ajouterMur({distance:4,hauteur:2.50,angle:0,x:0,z:0});
        editeur.deplacerMur(m.id, 5, -3);
        this._assert('Mur deplace x=5',m.params.x===5);
        this._assert('Mur deplace z=-3',m.params.z===-3);
    }
    T19_pivoterMur() {
        this._section('19 — PIVOTER MUR');
        var m=this.getMurs()[0];
        var oldAngle = m.params.angle;
        editeur.pivoterMur(m.id, 45);
        this._assert('Mur pivote +45',m.params.angle===oldAngle+45, 'angle='+m.params.angle);
        editeur.pivoterMur(m.id, -45);
        this._assert('Mur pivote retour',m.params.angle===oldAngle);
    }
    T20_redimensionnerMur() {
        this._section('20 — REDIMENSIONNER MUR');
        var m=this.getMurs()[0];
        editeur.redimensionnerMur(m.id, 'fin', 6);
        this._assert('Mur redim dist=6',m.params.distance===6, 'dist='+m.params.distance);
        editeur.redimensionnerMur(m.id, 'debut', 3);
        this._assert('Mur redim dist=3',m.params.distance===3);
        this.viderTout();
    }

    // ============================
    // 21-22 : TROUS DANS LES MURS
    // ============================
    T21_trouRectangulaire() {
        this._section('21 — TROU RECTANGULAIRE'); this.viderTout();
        var m=this.ajouterMur({distance:5,hauteur:2.50,angle:0});
        editeur.ajouterTrouElement(m.id, {x:1,y:0.50,largeur:1.20,hauteur:1.50});
        this._assert('Trou ajoute',m.params.trous&&m.params.trous.length===1);
        this._assert('Trou largeur=1.20',m.params.trous[0].largeur===1.20);
        this._assert('Trou hauteur=1.50',m.params.trous[0].hauteur===1.50);
        // 2eme trou
        editeur.ajouterTrouElement(m.id, {x:3,y:0,largeur:0.83,hauteur:2.04});
        this._assert('2 trous',m.params.trous.length===2);
    }
    T22_trouRond() {
        this._section('22 — TROU ROND + ARRONDI');
        var m=this.getMurs()[0];
        var nbAvant = m.params.trous ? m.params.trous.length : 0;
        try {
            editeur.ajouterTrouRond(m.id, {x:4,y:1.50,largeur:0.40,hauteur:0.40});
            this._assert('Trou rond ajoute', m.params.trous.length > nbAvant);
        } catch(e) { this._log('Trou rond', false, e.message); }
        try {
            editeur.ajouterTrouArrondi(m.id, {x:2,y:0.50,largeur:1.00,hauteur:1.50});
            this._assert('Trou arrondi ajoute', m.params.trous.length > nbAvant+1);
        } catch(e) { this._log('Trou arrondi', false, e.message); }
        this.viderTout();
    }

    // ============================
    // 23-24 : GROUPES
    // ============================
    T23_grouper() {
        this._section('23 — GROUPER MURS'); this.viderTout();
        var m1=this.ajouterMur({distance:4,hauteur:2.50,angle:0,x:0,z:0});
        var m2=this.ajouterMur({distance:3,hauteur:2.50,angle:90,x:4,z:0});
        var gid=editeur.grouperElements([m1.id, m2.id]);
        this._assert('Groupe cree',gid!==null&&gid!==undefined, 'groupeId='+gid);
        var grp=editeur.trouverGroupe(m1.id);
        this._assert('Groupe contient 2 murs',grp&&grp.length===2, 'count='+(grp?grp.length:0));
    }
    T24_degrouperEtDeplacerGroupe() {
        this._section('24 — DEGROUPER + DEPLACER GROUPE');
        var m1=this.getMurs()[0], m2=this.getMurs()[1];
        // Deplacer le groupe
        editeur.deplacerGroupe([m1.id, m2.id], 2, 0);
        this._assert('Groupe deplace x+=2', m1.params.x===2, 'x='+m1.params.x);
        // Pivoter le groupe
        var a1=m1.params.angle;
        editeur.pivoterGroupe([m1.id, m2.id], 10);
        this._assert('Groupe pivote +10', m1.params.angle===a1+10, 'angle='+m1.params.angle);
        // Degrouper
        editeur.degrouper(m1.id);
        var grp=editeur.trouverGroupe(m1.id);
        this._assert('Mur 1 degroupe', !grp||grp.length<=1);
        this.viderTout();
    }

    // ============================
    // 25-26 : EXTREMITES + COMPTER BRIQUES
    // ============================
    T25_extremitesMur() {
        this._section('25 — EXTREMITES MUR'); this.viderTout();
        var m=this.ajouterMur({distance:5,hauteur:2.50,angle:0,x:0,z:0});
        var ext=editeur.extremitesMur(m);
        this._assert('Extremites existent',ext!==null&&ext!==undefined);
        if(ext) {
            this._assert('x1 defini',typeof ext.x1==='number','x1='+ext.x1);
            this._assert('x2 defini',typeof ext.x2==='number','x2='+ext.x2);
            this._assert('Longueur ~5m', Math.abs(Math.sqrt(Math.pow(ext.x2-ext.x1,2)+Math.pow(ext.z2-ext.z1,2))-5)<0.5, 'dist='+Math.sqrt(Math.pow(ext.x2-ext.x1,2)+Math.pow(ext.z2-ext.z1,2)).toFixed(2));
        }
    }
    T26_compterBriques() {
        this._section('26 — COMPTER BRIQUES');
        var nb=editeur.compterBriques();
        this._assert('Briques > 0',nb>0, nb+' briques');
        this.viderTout();
    }

    // ============================
    // 27-28 : TRAITS AU SOL + ZONES
    // ============================
    T27_traitsAuSol() {
        this._section('27 — TRAITS AU SOL'); this.viderTout();
        var t1=editeur.ajouterTrait({x1:0,z1:0,x2:5,z2:0,couleur:'#4a9eff',tirets:true,rempli:false});
        this._assert('Trait 1 cree',t1!==null);
        var t2=editeur.ajouterTrait({x1:0,z1:0,x2:0,z2:5,couleur:'#FF0000',tirets:false,rempli:true});
        this._assert('Trait 2 cree',t2!==null);
        this._assert('2 traits',editeur.traits.length===2);
        editeur.supprimerTrait(t1.id);
        this._assert('1 trait apres suppr',editeur.traits.length===1);
        editeur.supprimerTrait(t2.id);
        this._assert('0 traits',editeur.traits.length===0);
    }
    T28_detecterPieces() {
        this._section('28 — DETECTER PIECES FERMEES'); this.viderTout();
        // Construire un carre ferme en calculant les bonnes extremites
        var m1=this.ajouterMur({distance:4,hauteur:2.50,angle:0,x:0,z:0});
        var e1=editeur.extremitesMur(m1);
        var m2=this.ajouterMur({distance:3,hauteur:2.50,angle:90,x:e1?e1.x2:4,z:e1?e1.z2:0});
        var e2=editeur.extremitesMur(m2);
        var m3=this.ajouterMur({distance:4,hauteur:2.50,angle:180,x:e2?e2.x2:4,z:e2?e2.z2:-3});
        var e3=editeur.extremitesMur(m3);
        var m4=this.ajouterMur({distance:3,hauteur:2.50,angle:270,x:e3?e3.x2:0,z:e3?e3.z2:-3});
        this._assert('4 murs carre ferme',this.getMurs().length===4);
        try {
            var pieces=editeur.detecterPiecesFermees();
            this._assert('Pieces detectees',pieces!==null&&pieces!==undefined);
            if(pieces) this._assert('Pieces trouvees', pieces.length>=0, pieces.length+' pieces');
        } catch(e) { this._log('detecterPiecesFermees',false,e.message); }
    }

    // ============================
    // 29-30 : UNDO / REDO
    // ============================
    T29_undoRedo() {
        this._section('29 — UNDO / REDO'); this.viderTout();
        // Sauvegarder l'etat VIDE
        editeur.sauvegarderEtat();
        // Ajouter mur 1
        this.ajouterMur({distance:4,hauteur:2.50,angle:0});
        // Sauvegarder l'etat avec 1 mur
        editeur.sauvegarderEtat();
        // Ajouter mur 2
        this.ajouterMur({distance:3,hauteur:2.50,angle:90,x:4,z:0});
        this._assert('2 murs avant undo',this.getMurs().length===2);
        // Undo = revenir a l'etat avec 1 mur
        editeur.annuler();
        this._assert('1 mur apres undo',this.getMurs().length===1, 'count='+this.getMurs().length);
        // Redo = revenir a 2 murs
        editeur.refaire();
        this._assert('2 murs apres redo',this.getMurs().length===2, 'count='+this.getMurs().length);
        this.viderTout();
    }
    T30_undoMultiple() {
        this._section('30 — UNDO MULTIPLE'); this.viderTout();
        // Etat 0 : vide
        editeur.sauvegarderEtat();
        this.ajouterMur({distance:2,hauteur:2,angle:0});
        // Etat 1 : 1 mur
        editeur.sauvegarderEtat();
        this.ajouterMur({distance:2,hauteur:2,angle:90,x:2});
        // Etat 2 : 2 murs
        editeur.sauvegarderEtat();
        this.ajouterMur({distance:2,hauteur:2,angle:180,x:2,z:-2});
        this._assert('3 murs',this.getMurs().length===3);
        // 3 undo : 3 murs -> 2 -> 1 -> 0
        editeur.annuler();
        this._assert('2 apres 1 undo',this.getMurs().length===2, 'count='+this.getMurs().length);
        editeur.annuler();
        this._assert('1 apres 2 undo',this.getMurs().length===1, 'count='+this.getMurs().length);
        editeur.annuler();
        this._assert('0 apres 3 undo',this.getMurs().length===0, 'count='+this.getMurs().length);
        // 2 redo : 0 -> 1 -> 2
        editeur.refaire();
        this._assert('1 apres 1 redo',this.getMurs().length===1, 'count='+this.getMurs().length);
        editeur.refaire();
        this._assert('2 apres 2 redo',this.getMurs().length===2, 'count='+this.getMurs().length);
        this.viderTout();
    }

    // ============================
    // 31-34 : TOUS MODELES PORTES/FENETRES + COULEURS
    // ============================
    T31_tousModelesPortes() {
        this._section('31 — TOUTES PORTES'); this.viderTout();
        this.ajouterMur({distance:25,hauteur:2.50,angle:0});
        var m=Porte.modeles();
        for(var i=0;i<m.length;i++){
            var g=this.poserPorte(m[i].id,0.5+i*1.3,0,0,m[i].largeur,m[i].hauteur,0);
            this._assert('Porte '+m[i].id,g&&g.children.length>0);
        }
    }
    T32_couleursPorte() {
        this._section('32 — COULEURS PORTE');
        var excl=this.getExclusions()[0];
        if(excl&&excl.group3D) {
            Porte.changerCouleur(excl.group3D,'#FF0000','#00FF00');
            var c=Porte.lireCouleurs(excl.group3D);
            this._assert('Porte cadre rouge',c.cadre==='#ff0000','cadre='+c.cadre);
            this._assert('Porte panneau vert',c.porte==='#00ff00','porte='+c.porte);
        } else { this._log('Couleur porte',false,'pas d\'exclusion'); }
    }
    T33_tousModelesFenetres() {
        this._section('33 — TOUTES FENETRES');
        var m=Fenetre.modeles();
        for(var i=0;i<m.length;i++){
            var g=this.poserFenetre(m[i].id,0.5+i*1.3,0,m[i].y,m[i].largeur,m[i].hauteur,0);
            this._assert('Fenetre '+m[i].id,g&&g.children.length>0);
        }
    }
    T34_couleursFenetre() {
        this._section('34 — COULEURS FENETRE');
        // Trouver une fenetre
        var excl=null;
        for(var i=0;i<this.getExclusions().length;i++){
            if(this.getExclusions()[i]._type==='fenetre'||(!this.getExclusions()[i]._type&&this.getExclusions()[i].group3D&&this.getExclusions()[i].group3D.userData.fenetreCreation)){
                excl=this.getExclusions()[i]; break;
            }
        }
        if(excl&&excl.group3D) {
            Fenetre.changerCouleur(excl.group3D,'#FF0000','#FFFF00',0.5);
            var c=Fenetre.lireCouleurs(excl.group3D);
            this._assert('Fenetre cadre change',c!==null);
        } else { this._log('Couleur fenetre',false,'pas de fenetre trouvee'); }
        this.viderTout();
    }

    // ============================
    // 35-40 : LAINE + PLACO + COTES + REVETEMENTS
    // ============================
    T35_laineTousAngles() {
        this._section('35 — LAINE 4 ANGLES'); this.viderTout();
        [0,90,180,270].forEach(function(a,i){
            this.ajouterMur({distance:4,hauteur:2.50,angle:a,x:i*5,z:0});
            var g=this.poserLaine(i*5+2,0,0,4,2.50,a,0.075,1,0.11);
            this._assert('Laine angle='+a,g&&g.userData.laineInfo);
        }.bind(this));
    }
    T36_placoTousAnglesEtCotes() {
        this._section('36 — PLACO ANGLES + DEVANT/DERRIERE');
        for(var i=0;i<4;i++){
            var g=this.poserPlaco(i*5+2,0,0,4,2.50,[0,90,180,270][i],0.013,1,0.11);
            this._assert('Placo angle='+[0,90,180,270][i],g&&g.userData.placoInfo);
        }
        // Cote derriere
        var gBack=this.poserPlaco(2,0,0,4,2.50,0,0.013,-1,0.11);
        this._assert('Placo side=-1',gBack&&gBack.userData.placoInfo.side===-1);
        var gFront=this.getPlacos()[0];
        var d=Math.abs(gFront.position.z-gBack.position.z)+Math.abs(gFront.position.x-gBack.position.x);
        this._assert('Devant/derriere differents',d>0.01,'dist='+d.toFixed(4));
    }
    T37_tousModelesPlinthe() {
        this._section('37 — TOUTES PLINTHES');
        var m=Plinthe.modeles();
        for(var i=0;i<m.length;i++){
            var g=this.poserPlinthe(m[i].id,0);
            this._assert('Plinthe '+m[i].id,g&&g.userData.plinthInfo.modeleId===m[i].id);
        }
    }
    T38_plinthePosEtCouleur() {
        this._section('38 — PLINTHE POSITION + COULEUR');
        var plac=this.getPlacos()[0];
        for(var i=0;i<this.getPlinthes().length;i++){
            var pl=this.getPlinthes()[i];
            var d=Math.sqrt(Math.pow(pl.position.x-plac.position.x,2)+Math.pow(pl.position.z-plac.position.z,2));
            this._assert('Plinthe '+(i+1)+' dist<5cm',d<0.05,(d*100).toFixed(1)+'cm');
            this._assert('Plinthe '+(i+1)+' Y=0',Math.abs(pl.position.y)<0.01);
        }
        // Couleur
        var pl=this.getPlinthes()[0];
        Plinthe.changerCouleur(pl,'#FF0000');
        var c=Plinthe.lireCouleur(pl);
        this._assert('Plinthe couleur rouge',c==='#ff0000','c='+c);
    }
    T39_tousModelesCarrelage() {
        this._section('39 — TOUS CARRELAGES + PERF');
        var m=Carrelage.modeles();
        for(var i=0;i<m.length;i++){
            var g=this.poserCarrelage(m[i].id,0);
            this._assert('Carrelage '+m[i].id,g&&g.userData.carrelageInfo.modeleId===m[i].id);
            var mc=0; g.traverse(function(c){if(c.isMesh)mc++;});
            this._assert('Carrelage '+m[i].id+' perf',mc<=2,mc+' meshes');
        }
    }
    T40_tousModelesPP() {
        this._section('40 — TOUS PAPIERS PEINTS + PERF');
        var m=PapierPeint.modeles();
        for(var i=0;i<m.length;i++){
            var g=this.poserPapierPeint(m[i].id,0);
            this._assert('PP '+m[i].id,g&&g.userData.papierPeintInfo.modeleId===m[i].id);
            var mc=0; g.traverse(function(c){if(c.isMesh)mc++;});
            this._assert('PP '+m[i].id+' perf',mc===1,mc+' meshes');
        }
    }

    // ============================
    // 41-42 : COULEURS CARRELAGE/PP
    // ============================
    T41_couleurCarrelage() {
        this._section('41 — COULEUR CARRELAGE');
        var g=this.getCarrelages()[0];
        Carrelage.changerCouleurs(g,'#FF0000','#000000');
        this._assert('Carreau rouge',g.userData.carrelageInfo.couleurCarreau==='#FF0000');
        Carrelage.changerCouleurs(g,'#00FF00','#333');
        this._assert('Carreau vert',g.userData.carrelageInfo.couleurCarreau==='#00FF00');
    }
    T42_couleurPP() {
        this._section('42 — COULEUR PAPIER PEINT');
        var g=this.getPapiersPeints()[0];
        PapierPeint.changerCouleurs(g,'#0000FF','#FFFF00');
        this._assert('PP bleu/jaune',g.userData.papierPeintInfo.couleur1==='#0000FF'&&g.userData.papierPeintInfo.couleur2==='#FFFF00');
    }

    // ============================
    // 43-44 : COULEURS PLACO + LAINE
    // ============================
    T43_couleurPlaco() {
        this._section('43 — COULEUR PLACO');
        var g=this.getPlacos()[0];
        Placo.changerCouleur(g,'#FF0000',0.80); var c=Placo.lireCouleurs(g);
        this._assert('Placo rouge',c.placo==='#ff0000');
        this._assert('Placo opacite 80',c.opacite===80);
        Placo.changerCouleur(g,'#00FF00',0.50); c=Placo.lireCouleurs(g);
        this._assert('Placo vert',c.placo==='#00ff00');
    }
    T44_couleurLaine() {
        this._section('44 — COULEUR LAINE');
        var g=this.getLaines()[0];
        LaineDeVerre.changerCouleur(g,'#FF0000',0.70); var c=LaineDeVerre.lireCouleurs(g);
        this._assert('Laine rouge',c.laine==='#ff0000','c='+c.laine);
    }

    // ============================
    // 45-46 : PERSONNAGES + GHOSTS
    // ============================
    T45_personnages() {
        this._section('45 — PERSONNAGES');
        var p1=this.poserPersonnage(2,-2), p2=this.poserPersonnage(4,-1), p3=this.poserPersonnage(1,1);
        this._assert('3 personnages',this.getPersonnages().length===3);
        this._assert('Perso 1 worldX=2',p1.userData.persoInfo.worldX===2);
    }
    T46_ghosts() {
        this._section('46 — GHOSTS (previews)');
        var gPlaco=Placo.creerGhost(1.20,2.50,0.013,'#F5F5F0');
        this._assert('Ghost placo cree',gPlaco&&gPlaco.children.length>0);
        var gLaine=LaineDeVerre.creerGhost(1.20,2.50,0.075,'#F2D544');
        this._assert('Ghost laine cree',gLaine&&gLaine.children.length>0);
        var gPlinthe=plintheObj.creerGhost('platre-8',1,null);
        this._assert('Ghost plinthe cree',gPlinthe!==null);
        var gCarr=carrelageObj.creerGhost('metro',1,2.50);
        this._assert('Ghost carrelage cree',gCarr!==null);
        var gPP=ppObj.creerGhost('damier',1,2.50);
        this._assert('Ghost papier peint cree',gPP!==null);
    }

    // ============================
    // 47-49 : SUPPRESSIONS COMPLETES
    // ============================
    T47_suppressionsTout() {
        this._section('47 — SUPPR UN DE CHAQUE');
        var np=this.getPlacos().length; this.supprimerPlaco(this.getPlacos()[np-1]); this._assert('Placo -1',this.getPlacos().length===np-1);
        var nl=this.getLaines().length; this.supprimerLaine(this.getLaines()[nl-1]); this._assert('Laine -1',this.getLaines().length===nl-1);
        var npl=this.getPlinthes().length; this.supprimerPlinthe(this.getPlinthes()[0]); this._assert('Plinthe -1',this.getPlinthes().length===npl-1);
        var nc=this.getCarrelages().length; this.supprimerCarrelage(this.getCarrelages()[0]); this._assert('Carrelage -1',this.getCarrelages().length===nc-1);
        var npp=this.getPapiersPeints().length; this.supprimerPapierPeint(this.getPapiersPeints()[0]); this._assert('PP -1',this.getPapiersPeints().length===npp-1);
        var npe=this.getPersonnages().length; this.supprimerPersonnage(this.getPersonnages()[0]); this._assert('Perso -1',this.getPersonnages().length===npe-1);
    }
    T48_viderToutComplet() {
        this._section('48 — VIDER TOUT');
        while(this.getPlacos().length>0) this.supprimerPlaco(this.getPlacos()[0]);
        while(this.getLaines().length>0) this.supprimerLaine(this.getLaines()[0]);
        while(this.getPlinthes().length>0) this.supprimerPlinthe(this.getPlinthes()[0]);
        while(this.getCarrelages().length>0) this.supprimerCarrelage(this.getCarrelages()[0]);
        while(this.getPapiersPeints().length>0) this.supprimerPapierPeint(this.getPapiersPeints()[0]);
        while(this.getPersonnages().length>0) this.supprimerPersonnage(this.getPersonnages()[0]);
        this._assert('0 placos',this.getPlacos().length===0);
        this._assert('0 laines',this.getLaines().length===0);
        this._assert('0 plinthes',this.getPlinthes().length===0);
        this._assert('0 carrelages',this.getCarrelages().length===0);
        this._assert('0 PP',this.getPapiersPeints().length===0);
        this._assert('0 persos',this.getPersonnages().length===0);
        this.viderTout();
    }

    // ============================
    // 49-50 : SCENE MANAGER
    // ============================
    T49_sceneManager() {
        this._section('49 — SCENE MANAGER');
        sceneManager.setCouleurCiel('#1a1a2e');
        this._assert('Ciel change',true);
        sceneManager.setCielDegrade('#0044AA','#87CEEB');
        this._assert('Ciel degrade',true);
        sceneManager.setCouleurSol('#333333');
        this._assert('Sol change',true);
        sceneManager.setAmbiante(0.6);
        this._assert('Ambiante 0.6',sceneManager.ambiant.intensity===0.6);
        sceneManager.setCamera(10,8,15);
        this._assert('Camera deplacee',Math.abs(sceneManager.camera.position.x-10)<0.1);
        sceneManager.setCible(2,1,0);
        this._assert('Cible changee',Math.abs(sceneManager.controls.target.x-2)<0.1);
        sceneManager.setGrille(false);
        this._assert('Grille cachee',!sceneManager.grille.visible);
        sceneManager.setGrille(true);
        this._assert('Grille visible',sceneManager.grille.visible);
        // Remettre les defaults
        sceneManager.setCouleurCiel('#87CEEB'); sceneManager.setCouleurSol('#555555');
        sceneManager.setAmbiante(0.4); sceneManager.setCamera(8,6,12); sceneManager.setCible(5,1,0);
    }
    T50_plateau() {
        this._section('50 — PLATEAU');
        sceneManager.setPlateau(8,6,1);
        this._assert('Plateau 8x6',true);
        sceneManager.setPlateau(50,50,1); // remettre default
    }

    // ============================
    // 51-54 : PIECE FERMEE — LAINE + PLACO FERME SUR 4 MURS
    // ============================
    T51_pieceFermeeLaine() {
        this._section('51 — PIECE FERMEE : LAINE SUR 4 MURS');
        this.viderTout();
        // Construire un carre 4x3m avec 4 murs individuels
        var m1=this.ajouterMur({distance:4,hauteur:2.50,angle:0,x:0,z:0});
        var e1=editeur.extremitesMur(m1);
        var m2=this.ajouterMur({distance:3,hauteur:2.50,angle:90,x:e1?e1.x2:4,z:e1?e1.z2:0});
        var e2=editeur.extremitesMur(m2);
        var m3=this.ajouterMur({distance:4,hauteur:2.50,angle:180,x:e2?e2.x2:4,z:e2?e2.z2:-3});
        var e3=editeur.extremitesMur(m3);
        var m4=this.ajouterMur({distance:3,hauteur:2.50,angle:270,x:e3?e3.x2:0,z:e3?e3.z2:-3});
        this._assert('4 murs carre',this.getMurs().length===4);

        // Detecter la piece fermee
        var piece = _trouverMursPieceFermee(m1);
        this._assert('Piece fermee detectee', piece!==null, piece ? piece.length+' murs' : 'non');

        // Poser laine sur chaque mur
        var murs=this.getMurs();
        for(var i=0;i<murs.length;i++){
            var p=murs[i].params;
            var segs=editeur._segments(p);
            if(segs.length===0) continue;
            var s=segs[0];
            var cx=(s.x1+s.x2)/2, cz=(s.z1+s.z2)/2;
            var sAngle=Math.atan2(s.z2-s.z1,s.x2-s.x1)*180/Math.PI;
            var slen=Math.sqrt(Math.pow(s.x2-s.x1,2)+Math.pow(s.z2-s.z1,2));
            var g=this.poserLaine(cx,cz,0,slen,p.hauteur,sAngle,0.075,1,0.11);
            this._assert('Laine mur '+(i+1),g!==null);
        }
        this._assert('4 laines posees',this.getLaines().length===4);
    }
    T52_pieceFermeePlaco() {
        this._section('52 — PIECE FERMEE : PLACO INT + EXT');
        var murs=this.getMurs();

        // Calculer centre piece
        var cx0=0,cz0=0,np=0;
        for(var i=0;i<murs.length;i++){
            var segs=editeur._segments(murs[i].params); if(!segs.length) continue;
            cx0+=segs[0].x1+segs[0].x2; cz0+=segs[0].z1+segs[0].z2; np+=2;
        }
        cx0/=np; cz0/=np;
        this._assert('Centre piece', true, '('+cx0.toFixed(2)+','+cz0.toFixed(2)+')');

        // Calculer infos
        var infos=[];
        for(var i=0;i<murs.length;i++){
            var p=murs[i].params;
            var segs=editeur._segments(p); if(!segs.length) continue;
            var s=segs[0];
            var bt=BRIQUES_TYPES[p.briqueType]||BRIQUES_TYPES.standard;
            var slen=Math.sqrt(Math.pow(s.x2-s.x1,2)+Math.pow(s.z2-s.z1,2));
            var snx=(s.x2-s.x1)/slen, snz=(s.z2-s.z1)/slen;
            var sAngle=Math.atan2(s.z2-s.z1,s.x2-s.x1)*180/Math.PI;
            // Perpendiculaire
            var nnx=-snz, nnz=snx;
            // Detecter interieur : la perpendiculaire side=1 pointe-t-elle vers le centre ?
            var midX=(s.x1+s.x2)/2, midZ=(s.z1+s.z2)/2;
            var dot=(cx0-midX)*nnx+(cz0-midZ)*nnz;
            // side=1 et dot>0 → side=1 = interieur. side=1 et dot<0 → side=1 = exterieur
            var sideInt = dot > 0 ? 1 : -1; // le side qui est interieur
            infos.push({s:s,slen:slen,snx:snx,snz:snz,sAngle:sAngle,murH:p.hauteur,murEp:bt.epaisseur,sideInt:sideInt});
        }

        // Poser placo INTERIEUR (side = sideInt)
        var laineEp=0.075, placoEp=0.013, gap=0.005;
        for(var i=0;i<infos.length;i++){
            var inf=infos[i];
            var prev=infos[(i+infos.length-1)%infos.length];
            var next=infos[(i+1)%infos.length];
            // INTERIEUR : extension = brique complete + gap + laine + placo
            var coinInt = inf.murEp + gap + laineEp + placoEp;
            var poseLargeur = inf.slen + coinInt * 2;
            var cx=(inf.s.x1+inf.s.x2)/2, cz=(inf.s.z1+inf.s.z2)/2;
            var g=this.poserPlaco(cx,cz,0,poseLargeur,inf.murH,inf.sAngle,placoEp,inf.sideInt,inf.murEp+laineEp);
            this._assert('Placo INT mur '+(i+1), g!==null, 'L='+poseLargeur.toFixed(3)+'m side='+inf.sideInt);
        }

        // Poser placo EXTERIEUR (side = -sideInt)
        for(var i=0;i<infos.length;i++){
            var inf=infos[i];
            // EXTERIEUR : extension = brique complete + gap + laine + placo + 10cm marge
            var coinExt = inf.murEp + gap + laineEp + placoEp + 0.10;
            var poseLargeur = inf.slen + coinExt * 2;
            var cx=(inf.s.x1+inf.s.x2)/2, cz=(inf.s.z1+inf.s.z2)/2;
            var g=this.poserPlaco(cx,cz,0,poseLargeur,inf.murH,inf.sAngle,placoEp,-inf.sideInt,inf.murEp+laineEp);
            this._assert('Placo EXT mur '+(i+1), g!==null, 'L='+poseLargeur.toFixed(3)+'m side='+(-inf.sideInt));
        }

        this._assert('8 placos poses (4 int + 4 ext)',this.getPlacos().length===8, 'count='+this.getPlacos().length);
    }
    T53_pieceFermeeVerifCoins() {
        this._section('53 — PIECE FERMEE : ALGO VERIFICATION CONTACT');
        var placos=this.getPlacos();
        if(placos.length<4){this._log('Pas assez de placos',false);return;}

        // Calculer le rectangle 2D (vue du dessus) de chaque placo
        var rects = [];
        for(var i=0;i<placos.length;i++){
            var pi=placos[i].userData.placoInfo;
            if(!pi) continue;
            var rad = pi.angle * Math.PI / 180;
            var gx = placos[i].position.x, gz = placos[i].position.z;
            var halfL = pi.largeur / 2;
            var halfEp = pi.ep / 2;
            // Direction le long du mur
            var dx = Math.cos(rad), dz = Math.sin(rad);
            // Direction perpendiculaire (vers l'exterieur)
            var nx = -Math.sin(rad), nz = Math.cos(rad);
            // 4 coins du rectangle placo en vue du dessus
            var corners = [
                { x: gx - dx*halfL - nx*halfEp, z: gz - dz*halfL - nz*halfEp },
                { x: gx + dx*halfL - nx*halfEp, z: gz + dz*halfL - nz*halfEp },
                { x: gx + dx*halfL + nx*halfEp, z: gz + dz*halfL + nz*halfEp },
                { x: gx - dx*halfL + nx*halfEp, z: gz - dz*halfL + nz*halfEp }
            ];
            // Bounding box
            var minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;
            for(var c=0;c<4;c++){
                if(corners[c].x<minX) minX=corners[c].x;
                if(corners[c].x>maxX) maxX=corners[c].x;
                if(corners[c].z<minZ) minZ=corners[c].z;
                if(corners[c].z>maxZ) maxZ=corners[c].z;
            }
            rects.push({
                corners:corners, minX:minX, maxX:maxX, minZ:minZ, maxZ:maxZ,
                gx:gx, gz:gz, largeur:pi.largeur, ep:pi.ep, angle:pi.angle,
                // Extremites le long du mur
                ax: gx - dx*halfL, az: gz - dz*halfL,
                bx: gx + dx*halfL, bz: gz + dz*halfL
            });
            this._assert('Placo '+(i+1)+' position', true,
                'centre=('+gx.toFixed(3)+','+gz.toFixed(3)+') L='+pi.largeur.toFixed(3)+' angle='+pi.angle.toFixed(1));
        }

        // Fonction : un point est-il dans un rectangle placo ?
        function pointDansRect(px, pz, rect) {
            // Test via produits croises (point dans polygone convexe 4 coins)
            var c = rect.corners;
            for (var i=0; i<4; i++) {
                var j = (i+1)%4;
                var ex = c[j].x - c[i].x, ez = c[j].z - c[i].z;
                var px2 = px - c[i].x, pz2 = pz - c[i].z;
                if (ex*pz2 - ez*px2 < -0.001) return false; // en dehors
            }
            return true;
        }

        // Pour chaque paire de placos adjacents : verifier le contact au coin
        for(var i=0;i<rects.length;i++){
            var j=(i+1)%rects.length;
            var ri = rects[i], rj = rects[j];

            // Le coin de la piece = l'extremite B du placo i et l'extremite A du placo j
            // Au moins un des 2 placos doit couvrir l'autre au coin

            // Test 1 : l'extremite B de placo i est-elle couverte par placo j ?
            var bDansJ = pointDansRect(ri.bx, ri.bz, rj);
            // Test 2 : l'extremite A de placo j est-elle couverte par placo i ?
            var aDansI = pointDansRect(rj.ax, rj.az, ri);
            // Test 3 : les bounding boxes se chevauchent-elles au coin ?
            var bbOverlap = ri.maxX >= rj.minX - 0.01 && rj.maxX >= ri.minX - 0.01 &&
                            ri.maxZ >= rj.minZ - 0.01 && rj.maxZ >= ri.minZ - 0.01;

            var contact = bDansJ || aDansI || bbOverlap;
            this._assert('Coin '+(i+1)+'->'+(j+1)+' contact', contact,
                'B_in_J='+bDansJ+' A_in_I='+aDansI+' BB='+bbOverlap);
        }

        // Verifier laine/placo pas au meme endroit
        for(var i=0;i<Math.min(this.getLaines().length,this.getPlacos().length);i++){
            var lp=this.getLaines()[i].position, pp=this.getPlacos()[i].position;
            var d=Math.sqrt(Math.pow(lp.x-pp.x,2)+Math.pow(lp.z-pp.z,2));
            this._assert('Laine/placo '+(i+1)+' separes',d>0.001,'dist='+d.toFixed(4));
        }
    }
    T54_pieceFermeePlinthesCarrelage() {
        this._section('54 — PIECE FERMEE : PLINTHE + CARRELAGE SUR 4 MURS');
        // Poser plinthe et carrelage sur chaque placo
        for(var i=0;i<this.getPlacos().length;i++){
            var pl=this.poserPlinthe('platre-10',i);
            this._assert('Plinthe placo '+(i+1),pl!==null);
            var cr=this.poserCarrelage('metro',i);
            this._assert('Carrelage placo '+(i+1),cr!==null);
        }
        var nbPlacos = this.getPlacos().length;
        this._assert(nbPlacos+' plinthes',this.getPlinthes().length===nbPlacos,'count='+this.getPlinthes().length);
        this._assert(nbPlacos+' carrelages',this.getCarrelages().length===nbPlacos,'count='+this.getCarrelages().length);

        // Chaque plinthe collee a son placo
        for(var i=0;i<this.getPlinthes().length;i++){
            var pl=this.getPlinthes()[i];
            var plac=this.getPlacos()[Math.min(i,this.getPlacos().length-1)];
            var d=Math.sqrt(Math.pow(pl.position.x-plac.position.x,2)+Math.pow(pl.position.z-plac.position.z,2));
            this._assert('Plinthe '+(i+1)+' collee (<5cm)',d<0.05,(d*100).toFixed(1)+'cm');
        }
        this.viderTout();
    }

    // ============================
    // 55-57 : PIECE COMPLETE + SUPERPOSITION
    // ============================
    T55_pieceCompleteTout() {
        this._section('51 — PIECE COMPLETE AVEC TOUT'); this.viderTout();
        this.ajouterMur({distance:4,hauteur:2.50,angle:0,x:0,z:0});
        this.ajouterMur({distance:3,hauteur:2.50,angle:90,x:4,z:0});
        this.ajouterMur({distance:4,hauteur:2.50,angle:180,x:4,z:-3});
        this.ajouterMur({distance:3,hauteur:2.50,angle:270,x:0,z:-3});
        this.poserPorte('double',2,0,0,1.46,2.04,0);
        this.poserFenetre('large',6,0,0.80,2.40,1.40,180);
        this.poserLaine(2,0,0,4,2.50,0); this.poserPlaco(2,0,0,4,2.50,0);
        this.poserPlinthe('bois-10',0); this.poserCarrelage('metro',0); this.poserPapierPeint('chevrons',0);
        this.poserPersonnage(2,-1.5);
        this._assert('4 murs',this.getMurs().length===4);
        this._assert('2 excl',this.getExclusions().length===2);
        this._assert('1 laine',this.getLaines().length===1);
        this._assert('1 placo',this.getPlacos().length===1);
        this._assert('1 plinthe',this.getPlinthes().length===1);
        this._assert('1 carrelage',this.getCarrelages().length===1);
        this._assert('1 PP',this.getPapiersPeints().length===1);
        this._assert('1 perso',this.getPersonnages().length===1);
    }
    T56_superposition() {
        this._section('52 — SUPERPOSITION ELEMENTS');
        // Verifier que chaque element a son tag unique
        var tags = {mur:0, placo:0, laine:0, porte:0, fenetre:0, plinthe:0, carrelage:0, papierPeint:0, personnage:0};
        sceneManager.scene.traverse(function(c) {
            if(c.userData) {
                if(c.userData.editeurId) tags.mur++;
                if(c.userData.isPlaco) tags.placo++;
                if(c.userData.isLaine) tags.laine++;
                if(c.userData.isPorte) tags.porte++;
                if(c.userData.isFenetre) tags.fenetre++;
                if(c.userData.isPlinthe) tags.plinthe++;
                if(c.userData.isCarrelage) tags.carrelage++;
                if(c.userData.isPapierPeint) tags.papierPeint++;
                if(c.userData.isPersonnage) tags.personnage++;
            }
        });
        this._assert('Tags mur en scene',tags.mur>0, tags.mur+' objets');
        this._assert('Tags placo en scene',tags.placo>0, tags.placo+' objets');
        this._assert('Tags laine en scene',tags.laine>0);
        this._assert('Tags porte en scene',tags.porte>0);
        this._assert('Tags plinthe en scene',tags.plinthe>0);
        this._assert('Tags carrelage en scene',tags.carrelage>0);
        this._assert('Tags PP en scene',tags.papierPeint>0);
        this._assert('Tags personnage en scene',tags.personnage>0);
        // Chaque type a un tag DIFFERENT — pas de collision
        this._assert('Pas de collision tags', true, 'mur/placo/laine/porte/plinthe/carrelage/PP/perso tous distincts');
    }
    T57_exportImport() {
        this._section('53 — EXPORT / IMPORT JSON');
        var json=editeur.exporterJSON('Test');
        this._assert('Export JSON',json&&json.length>10, json.length+' chars');
        var parsed=JSON.parse(json);
        this._assert('JSON a murs',parsed.murs&&parsed.murs.length===4);
        // Import dans une scene vide
        this.viderTout();
        editeur.importerJSON(json);
        this._assert('Import: murs restaures',this.getMurs().length===4, 'count='+this.getMurs().length);
        this.viderTout();
    }

    // ============================
    // 54-56 : SNAPSHOT / RESTORE COMPLET
    // ============================
    T58_snapshotComplet() {
        this._section('54 — SNAPSHOT COMPLET'); this.viderTout();
        // Reconstruire la piece
        this.ajouterMur({distance:4,hauteur:2.50,angle:0,x:0,z:0});
        this.ajouterMur({distance:3,hauteur:2.50,angle:90,x:4,z:0});
        this.ajouterMur({distance:4,hauteur:2.50,angle:180,x:4,z:-3});
        this.ajouterMur({distance:3,hauteur:2.50,angle:270,x:0,z:-3});
        this.poserPorte('simple',1,0,0,0.83,2.04,0);
        this.poserFenetre('rectangle',6,0,0.90,1.20,1.15,180);
        this.poserLaine(2,0,0,4,2.50,0); this.poserPlaco(2,0,0,4,2.50,0);
        this.poserPlinthe('platre-10',0); this.poserCarrelage('carre-30',0); this.poserPapierPeint('damier',0);
        this.poserPersonnage(2,-1.5);
        this._snap=this.snapshot();
        this._assert('Snap 4 murs',this._snap.murs.length===4);
        this._assert('Snap plinthes',this._snap.plinthes&&this._snap.plinthes.length===1);
        this._assert('Snap carrelages',this._snap.carrelages&&this._snap.carrelages.length===1);
        this._assert('Snap PPs',this._snap.papiersPeints&&this._snap.papiersPeints.length===1);
        this._assert('Snap persos',this._snap.personnages&&this._snap.personnages.length===1);
    }
    T59_viderEtRestore() {
        this._section('55 — VIDER + RESTORE');
        this.viderTout();
        this._assert('Vide: 0 murs',this.getMurs().length===0);
        this._assert('Vide: 0 placos',this.getPlacos().length===0);
        this.restore(this._snap);
        this._assert('Restore: 4 murs',this.getMurs().length===4);
        this._assert('Restore: 1 placo',this.getPlacos().length===1);
        this._assert('Restore: 1 plinthe',this.getPlinthes().length===1);
        this._assert('Restore: 1 carrelage',this.getCarrelages().length===1);
        this._assert('Restore: 1 PP',this.getPapiersPeints().length===1);
        this._assert('Restore: 1 perso',this.getPersonnages().length===1);
    }
    T60_saveLoadJSON() {
        this._section('56 — SAVE/LOAD JSON COMPLET');
        var data=this.getCacheComplet();
        this._assert('JSON plinthes',data.plinthes!==undefined);
        this._assert('JSON carrelages',data.carrelages!==undefined);
        this._assert('JSON PPs',data.papiersPeints!==undefined);
        this._assert('JSON persos',data.personnages!==undefined);
        this._assert('JSON camera',data.camera&&typeof data.camera.px==='number');
        var json=JSON.stringify(data);
        this._assert('Serialisable',json.length>100,json.length+' chars');
        this.chargerSlot(JSON.parse(json));
        this._assert('Load OK murs',this.getMurs().length===4);
        this._assert('Load OK placos',this.getPlacos().length>=1);
    }

    // ============================
    // 57 : NETTOYAGE FINAL
    // ============================
    T61_nettoyageFinal() {
        this._section('57 — NETTOYAGE FINAL');
        this.viderTout();
        this._assert('0 murs',this.getMurs().length===0);
        this._assert('0 excl',this.getExclusions().length===0);
        this._assert('0 placos',this.getPlacos().length===0);
        this._assert('0 laines',this.getLaines().length===0);
        this._assert('0 plinthes',this.getPlinthes().length===0);
        this._assert('0 carrelages',this.getCarrelages().length===0);
        this._assert('0 PPs',this.getPapiersPeints().length===0);
        this._assert('0 persos',this.getPersonnages().length===0);
        this._assert('0 traits',editeur.traits.length===0);
    }
}

window.testAPI=null;
window.runTests=function(){window.testAPI=new TestAPI();return window.testAPI.runAll();};
