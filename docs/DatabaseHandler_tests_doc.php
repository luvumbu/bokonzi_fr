<?php die(); ?>

================================================================
DOCUMENTATION DES TESTS — DatabaseHandler_tests.php
79 tests / 11 sections / toutes les 36 methodes couvertes
================================================================

Fichier teste : Class/DatabaseHandler.php
Fichier tests : Class/DatabaseHandler_tests.php
Format sortie : API JSON
BDD de test   : bokonzifr_test (creee/supprimee automatiquement)
Tables de test : test_categories, test_produits (avec FK)

================================================================
SCHEMA GLOBAL
================================================================

Creer tables → Remplir (insert) → Lire (select/find/search)
    → Modifier (update/edit) → Verifier les modifs
    → Supprimer (delete/remove) → Verifier les suppressions
    → Verifier schema → Tester raw → Nettoyer tout

Chaque test verifie l'action + la consequence :
on ne fait pas juste un insert, on verifie apres avec find/has/count
que la donnee est bien la (ou plus la apres un delete).

================================================================
1. CONNEXION (2 tests)
================================================================
Methodes testees : __construct(), getConnection()

#1  Creer la BDD de test "bokonzifr_test" et se connecter
    → Verifie que la connexion ne plante pas
#2  getConnection() retourne un objet mysqli
    → Verifie que l'objet interne est accessible

================================================================
2. CREATE (13 tests)
================================================================
Methodes testees : createTable(), tableExists(), getColumns(), addForeignKey()

#3  createTable('test_categories') avec 4 colonnes
    → La requete CREATE TABLE s'execute sans erreur
#4  tableExists('test_categories') = true
    → La table vient d'etre creee, elle doit exister
#5  getColumns() retourne exactement 4 colonnes
    → Verifie que le nombre de colonnes correspond
#6  Colonne 'id_cat' presente
    → Verifie la PK AUTO_INCREMENT
#7  Colonne 'nom' presente
    → Verifie VARCHAR(100) NOT NULL
#8  Colonne 'description' presente
    → Verifie TEXT
#9  Colonne 'created_at' presente
    → Verifie TIMESTAMP DEFAULT CURRENT_TIMESTAMP
#10 createTable('test_produits') avec 7 colonnes
    → 2eme table avec DECIMAL, INT, TINYINT
#11 tableExists('test_produits') = true
    → Confirme la creation
#12 getColumns() retourne exactement 7 colonnes
    → Coherence du schema
#13 addForeignKey(produits.id_cat → categories.id_cat)
    → FK avec ON DELETE SET NULL, ON UPDATE CASCADE
#14 tableExists('table_bidon') = false
    → Table qui n'existe pas doit retourner false
#15 Re-createTable sur table existante = pas d'erreur
    → IF NOT EXISTS ne plante pas sur doublon

================================================================
3. INSERT (9 tests)
================================================================
Methodes testees : insert(), insertBatch(), insertMulti(), add(), insertFromFile()
Etat BDD apres : 3 categories, 10 produits

#16 insert() 1 categorie 'Electronique'
    → success=true, id > 0 (auto-increment)
#17 insert() 2eme categorie 'Vetements'
    → success=true, id different du premier
#18 insert() doublon avec uniqueCol='nom'
    → Bloque : success=false (Electronique existe deja)
#19 insertBatch() 3 produits (Laptop, Telephone, T-shirt)
    → inserted=3, tous inseres d'un coup
#20 add() 1 ligne (Casque)
    → Raccourci, detecte tableau associatif → appelle insert()
#21 add() 2 lignes (Souris, Pantalon)
    → Raccourci, detecte tableau indexe → appelle insertBatch()
#22 insertMulti() 2 tables (1 categorie Sport + 2 produits)
    → total_inserted=3, insertion dans plusieurs tables en 1 appel
#23 insertFromFile() fichier temporaire avec 2 produits
    → Cree un fichier PHP avec $data, l'importe, inserted=2
#24 insertFromFile() fichier inexistant
    → Retourne success=false (gere l'erreur proprement)

================================================================
4. SELECT / FIND (20 tests)
================================================================
Methodes testees : count(), selectAll(), selectAllTables(), select(),
                   find(), findWhere(), has(), exists(), first(), last(), lastAuto()

#25 count('test_produits') = 10
    → Coherent avec les 10 inserts precedents
#26 selectAll('test_categories') = 3 lignes
    → Recupere toutes les categories
#27 selectAllTables() contient test_categories
    → Toutes les tables avec leurs donnees
#28 selectAllTables() contient test_produits
    → Idem, 2eme table presente
#29 selectAllTables() donnees correctes (3 cat, 10 prod)
    → Verifie les quantites dans chaque table
#30 select() avec param "prix > 100"
    → Requete preparee avec ?, trouve les produits chers
#31 select() multi-params "nom=Laptop AND stock=15"
    → 2 params bindes, 1 seul resultat exact
#32 find('nom', 'Laptop') retourne la ligne
    → Raccourci, verifie prix=999.99
#33 find() sans filtre = toutes les lignes
    → Equivalent de selectAll() via le raccourci
#34 find('nom', 'INTROUVABLE') = null
    → Aucun resultat → retourne null (pas un array vide)
#35 find('id_cat', X) retourne un array
    → Plusieurs produits dans la meme categorie → array de lignes
#36 findWhere(['nom'=>'Laptop', 'stock'=>15])
    → Plusieurs conditions AND, trouve la ligne
#37 findWhere() conditions impossibles = null
    → stock=9999 n'existe pas → null
#38 has('nom', 'Laptop') = true
    → Raccourci booleen : existe ou pas
#39 has('nom', 'Xbox') = false
    → N'existe pas
#40 exists() avec SQL + param trouve Laptop
    → Retourne la 1ere ligne trouvee (pas juste true)
#41 exists() introuvable = false
    → Retourne false (pas null)
#42 first() trie par id_prod = Laptop
    → Premier insere = premier par PK
#43 last() trie par id_prod = Ecran
    → Dernier insere via insertFromFile
#44 lastAuto() detecte la PK automatiquement
    → Meme resultat que last() mais sans specifier la colonne

================================================================
5. SEARCH (4 tests)
================================================================
Methodes testees : search(), searchMultiple()

#45 search('nom', 'a') trouve ≥3 resultats
    → LIKE '%a%' sur 1 colonne, plusieurs produits contiennent "a"
#46 search('nom', 'ZZZZZ') = 0 resultat
    → Aucune correspondance → tableau vide
#47 searchMultiple(['nom','description'], 'Electronique')
    → LIKE sur 2 colonnes avec OR, trouve dans test_categories
#48 searchMultiple() avec limit=3
    → Respecte la limite max de resultats

================================================================
6. JOIN (3 tests)
================================================================
Methode testee : join()

#49 INNER JOIN produits-categories
    → Retourne les produits qui ont une categorie (pas ceux avec id_cat=NULL)
#50 JOIN avec colonnes specifiques (AS produit, AS categorie)
    → Verifie que les alias fonctionnent dans le resultat
#51 LEFT JOIN
    → Plus de lignes que INNER (inclut produits sans categorie)

================================================================
7. UPDATE / EDIT (9 tests)
================================================================
Methodes testees : update(), edit(), updateBatch(), updateMulti()

#52 update() Laptop prix=899.99 stock=10
    → affected_rows=1
#53 Verification : Laptop prix=899.99 apres update
    → find() confirme la modification du prix
#54 Verification : Laptop stock=10 apres update
    → find() confirme la modification du stock
#55 edit() Casque prix=39.99
    → Raccourci : colonne + valeur + nouvelles donnees, affected=1
#56 Verification : Casque prix=39.99
    → find() confirme
#57 updateBatch() 2 lignes (Souris prix + Pantalon stock)
    → updated=2, 2 updates dans 1 table
#58 Verification : Souris prix=24.99
    → find() confirme le batch
#59 updateMulti() 2 tables (1 produit + 1 categorie)
    → total_affected=2, update multi-tables en 1 appel
#60 update() nom inexistant
    → affected_rows=0, pas d'erreur (success=true quand meme)

================================================================
8. DELETE / REMOVE (9 tests)
================================================================
Methodes testees : remove(), delete(), deleteById(), deleteBatch(), deleteMulti()

#61 remove() Raquette
    → Raccourci, affected=1
#62 has('Raquette') = false
    → Confirme la suppression
#63 delete() Ballon
    → affected_rows=1
#64 deleteById() Souris par id_prod
    → Trouve l'id avec find(), supprime, verifie avec has()
#65 deleteBatch() Clavier + Ecran
    → deleted=2, 2 suppressions en 1 appel
#66 deleteMulti() 2 tables (Pantalon + categorie Vetements)
    → total_deleted=2, supprime dans 2 tables en 1 appel
    → Note : la FK SET NULL met id_cat=NULL au lieu de supprimer les produits lies
#67 delete() nom inexistant
    → affected_rows=0, pas d'erreur
#68 remove() inexistant
    → Retourne 0, pas d'erreur
#69 count final = 4 produits restants
    → Laptop, Telephone, T-shirt, Casque (6 supprimes sur 10)

================================================================
9. SCHEMA (5 tests)
================================================================
Methodes testees : getTables(), getSummary()

#70 getTables() contient test_categories
    → Liste des tables de la BDD
#71 getTables() contient test_produits
    → 2eme table presente
#72 getSummary() retourne test_categories
    → Resume avec colonnes + nb enregistrements
#73 getSummary() retourne test_produits
    → Idem pour 2eme table
#74 getSummary() nb_enregistrements = 4
    → Coherent avec le count final apres les suppressions

================================================================
10. RAW (3 tests)
================================================================
Methode testee : raw()

#75 raw("SELECT COUNT(*)") = 4
    → Requete brute SELECT, coherent avec les deletes
#76 raw("UPDATE ... WHERE stock < 20")
    → Requete brute UPDATE, affected ≥ 1
#77 raw("INVALID SQL") = echec
    → SQL invalide → success=false (gere l'erreur sans crash)

================================================================
11. NETTOYAGE (2 tests)
================================================================

#78 DROP test_produits → tableExists = false
    → Table de test supprimee proprement
#79 DROP test_categories → tableExists = false
    → 2eme table supprimee, BDD de test propre

================================================================
COUVERTURE COMPLETE — 36/36 methodes
================================================================

Methode              | Tests
---------------------|-------
__construct()        | #1
getConnection()      | #2
createTable()        | #3, #10, #15
tableExists()        | #4, #11, #14, #78, #79
getColumns()         | #5-9, #12
addForeignKey()      | #13
insert()             | #16, #17, #18
insertBatch()        | #19
insertMulti()        | #22
add()                | #20, #21
insertFromFile()     | #23, #24
count()              | #25, #69
selectAll()          | #26
selectAllTables()    | #27-29
select()             | #30, #31
find()               | #32-35
findWhere()          | #36, #37
has()                | #38, #39, #62
exists()             | #40, #41
first()              | #42
last()               | #43
lastAuto()           | #44
search()             | #45, #46
searchMultiple()     | #47, #48
join()               | #49-51
update()             | #52, #60
edit()               | #55
updateBatch()        | #57
updateMulti()        | #59
delete()             | #63, #67
deleteById()         | #64
deleteBatch()        | #65
deleteMulti()        | #66
remove()             | #61, #68
raw()                | #75-77
close()              | fin du script
getTables()          | #70, #71
getSummary()         | #72-74
