<?php
session_start();
 

$test = $_POST['file'] ; 
$valeur = false; 
$extension="";
$autre="";
 

for($i = 0 ; $i<strlen($test ); $i++)
{
 
     if($test[$i]=="."){
          $valeur = true; 
     }
     if( $valeur==true){
          $extension = $extension.$test[$i];
     }
     else {
        $autre = $autre.$test[$i];
     }
 
 

}
 




$file_name=$_SESSION["file_name"];




function decode_chunk($data) {
    $data = explode(';base64,', $data);

    if (!is_array($data) || !isset($data[1])) {
        return false;
    }

    $data = base64_decode($data[1]);
    if (!$data) {
        return false;
    }

    return $data;
}

// $file_path: fichier cible: garde le même nom de fichier, dans le dossier uploads
$file_path = 'uploads/' . $autre.$file_name.$extension;
$file_data = decode_chunk($_POST['file_data']);

if (false === $file_data) {
    echo "error";
}

/* on ajoute le segment de données qu'on vient de recevoir 
 * au fichier qu'on est en train de ré-assembler: */
file_put_contents($file_path, $file_data, FILE_APPEND);

// nécessaire pour que JavaScript considère que la requête s'est bien passée:
echo json_encode([]); 




$_SESSION["file_name_bdd"] =$autre.$file_name.$extension;

$_SESSION["name_extension"] =$extension;
?>