<?php
/**
 * file_upload.php — Interface d'upload de fichiers / File upload interface
 * FR: Gere l'upload de fichiers par chunks et la galerie d'images
 * EN: Handles chunked file upload and image gallery
 */
?>

 <div class="simpson-form" id="file_dowload" title="<?= $url ?>">


     <h2 class="simpson-h2"><?= t('upload_title') ?></h2>

     <form id="uploadForm">
         <!-- FR: Bouton pour choisir un fichier / EN: File chooser button -->
         <label class="simpson-file-label" for="fileInput"><?= t('upload_choose') ?></label>
         <input type="file" id="fileInput" required>
         <button type="submit" class="Uploader"><?= t('upload_btn') ?></button>
     </form>


     <div class="bprogress">
         <div id="progressContainer" class="simpson-progress">
             <div id="progressBar" class="simpson-progress-bar"></div>
         </div>
         <p id="progressText" class="simpson-progress-text"></p>

         <div id="uploadedImageContainer"></div>
         <div class="file_dowload_src2" id="file_dowload_src2_container"></div>
     </div>

     <script>
         // FR: Traductions JS / EN: JS translations
         var UPLOAD_DONE_MSG = '<?= t('upload_done') ?>';

         var UPLOAD_FILE_MSG = '<?= t('upload_file_uploaded') ?>';
         var UPLOAD_PROGRESS_MSG = '<?= t('upload_progress') ?>';

         // FR: Rendu adaptatif selon le type de fichier
         // EN: Adaptive rendering based on file type
         function renderMedia(src) {
             const ext = src.split('.').pop().toLowerCase();
             const imageExts = ['jpg','jpeg','png','gif','bmp','webp','tiff','tif','svg','ico','heic','raw','psd','ai','eps'];
             const videoExts = ['mp4','m4v','mkv','mov','avi','wmv','flv','f4v','webm','mpg','mpeg','3gp','3g2','ts','vob','ogv','m2ts','divx'];
             const audioExts = ['mp3','wav','aac','ogg','oga','flac','wma','m4a','aiff','aif','opus','alac','mid','midi'];
             const mimeVideo = {mp4:'video/mp4',webm:'video/webm',ogg:'video/ogg',ogv:'video/ogg',mov:'video/quicktime',m4v:'video/x-m4v',mkv:'video/x-matroska',avi:'video/x-msvideo',wmv:'video/x-ms-wmv'};
             const mimeAudio = {mp3:'audio/mpeg',wav:'audio/wav',aac:'audio/aac',ogg:'audio/ogg',oga:'audio/ogg',flac:'audio/flac',m4a:'audio/mp4',opus:'audio/opus'};

             if (imageExts.includes(ext)) return '<img src="' + src + '" alt="">';
             if (videoExts.includes(ext)) {
                 const type = mimeVideo[ext] || 'video/' + ext;
                 return '<video controls><source src="' + src + '" type="' + type + '"></video>';
             }
             if (audioExts.includes(ext)) {
                 const type = mimeAudio[ext] || 'audio/' + ext;
                 return '<audio controls><source src="' + src + '" type="' + type + '"></audio>';
             }
             return '<a href="' + src + '" download>' + src.split('/').pop() + '</a>';
         }

         const CHUNK_SIZE = 10 * 1024 * 1024; // 10 Mo / 10 MB

         document.getElementById('uploadForm').addEventListener('submit', async (e) => {
             e.preventDefault();

             const file = document.getElementById('fileInput').files[0];
             if (!file) return;

             const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
             const fileName = file.name;

             const uploadedImageContainer = document.getElementById('uploadedImageContainer');
             uploadedImageContainer.innerHTML = '';

             let serverFileName = null;

             try {
                 for (let i = 0; i < totalChunks; i++) {
                     const start = i * CHUNK_SIZE;
                     const end = Math.min(start + CHUNK_SIZE, file.size);
                     const chunk = file.slice(start, end);

                     const formData = new FormData();
                     formData.append('file', chunk);
                     formData.append('chunkIndex', i);
                     formData.append('totalChunks', totalChunks);
                     formData.append('fileName', fileName);

                     const res = await fetch('<?= $appBase ?>req_on/upload_chunk.php', {
                         method: 'POST',
                         body: formData
                     });

                     const data = await res.json();

                     // FR: Capturer le nom de fichier du dernier chunk
                     // EN: Capture filename from last chunk response
                     if (data.fileName) {
                         serverFileName = data.fileName;
                     }

                     // FR: Mise a jour barre de progression / EN: Update progress bar
                     const progress = Math.round(((i + 1) / totalChunks) * 100);
                     document.getElementById('progressBar').style.width = progress + '%';
                     document.getElementById('progressText').innerText = `${UPLOAD_PROGRESS_MSG}: ${progress}%`;

                 }

                 // FR: Envoyer les metadonnees en BDD avec le VRAI nom de fichier
                 // EN: Send metadata to DB with the REAL filename
                 const file_dowload = document.getElementById("file_dowload").title;
                 var ok = new Information("<?= $appBase ?>req_on/insert_file.php");
                 ok.add("insert_file", fileName);
                 ok.add("file_dowload", file_dowload);
                 ok.add("generatedFileName", serverFileName);
                 console.log(ok.info());
                 ok.push();

                 document.getElementById('progressText').innerText += ' ✅ ' + UPLOAD_DONE_MSG;

                 // FR: Afficher le fichier avec le rendu adapte au type
                 // EN: Display file with type-adapted rendering
                 var mediaSrc = "<?= $appBase ?>uploads/" + serverFileName;
                 document.getElementById("file_dowload_src2_container").innerHTML = renderMedia(mediaSrc);
                 document.getElementById("file_dowload_src2_container").style.display = "block";

                 // FR: Met a jour le zoom-wrapper si present
                 var zoomWrapper = document.getElementById("zoom-wrapper-media");
                 if (zoomWrapper) zoomWrapper.innerHTML = renderMedia(mediaSrc);

             } catch (err) {

             }
         });
     </script>



 </div>


 <?php

$databaseHandler = new DatabaseHandler($dbname, $username, $password);

// FR: Requete personnalisee / EN: Custom query
$sql = "SELECT * FROM `projet_img` WHERE `id_projet_img`='$url'";

// FR: Execution et creation de la variable globale / EN: Execute and create global variable
$result = $databaseHandler->select_custom_safe($sql, 'mes_images');



?>
<div class="all_img" title="<?= $url ?>" id="all_img">
    <?php foreach ($mes_images as $img) { ?>


        <div class="image_block" data-id="<?= $img['id_projet_img_auto'] ?>">
            <?= renderFileMedia($appBase . 'uploads/' . $img['img_projet_src_img']) ?>

            <div class="buttons">
                <!-- FR: Bouton Supprimer / EN: Delete button -->
                <button class="delete_btn" title="<?= $img['img_projet_src_img'] ?>" onclick="deleteImage(this)"><?= t('upload_delete') ?></button>

                <!-- FR: Radio pour selectionner UNE image / EN: Radio to select ONE image -->
                <label>
                    <input type="radio" onclick="select_radio(this)" title="<?= $img['id_projet_img_auto'] ?>" name="selected_img" class="select_radio" id="<?= "radio_" . $img['id_projet_img_auto'] ?>" value="<?= $img['img_projet_src_img'] ?>" <?= (isset($mes_projets[0]['img_projet']) && $mes_projets[0]['img_projet'] == $img['id_projet_img_auto']) ? 'checked' : '' ?>>
                    <?= t('upload_select') ?>
                </label>

                <!-- FR: Checkbox pour cocher librement / EN: Checkbox for free selection -->
                <label>
                    <input type="checkbox" onclick="handleCheckboxClick(this)" class="check_btn" name="check_<?= $img['id_projet_img_auto'] ?>" value="<?= $img['id_projet_img_auto'] ?>" <?= (!empty($img['is_checked']) && $img['is_checked'] == 1) ? 'checked' : '' ?>>
                    <?= t('upload_check') ?>
                </label>
            </div>
        </div>
    <?php } ?>
</div>


 <script>


    // -------------------- RADIO (FR: selection unique / EN: single selection) --------------------
    function select_radio(_this) {

            // FR: Retire la classe selected de tous les blocs / EN: Remove selected class from all blocks
            document.querySelectorAll('.image_block').forEach(b => b.classList.remove('selected'));
                const block = _this.closest('.image_block');
                block.classList.add('selected');

                console.log(_this.title);


                const img_projet = document.getElementById("all_img").title;



                var mediaSrc = "<?= $appBase ?>uploads/" + _this.value;

                // FR: Met a jour le media principal dans zoom-wrapper
                var zoomWrapper = document.getElementById("zoom-wrapper-media");
                if (zoomWrapper) zoomWrapper.innerHTML = renderMedia(mediaSrc);

                var ok = new Information("<?= $appBase ?>req_on/update_img_projet.php"); // FR: creation de la classe / EN: class creation



                ok.add("img_projet", _this.title);
                ok.add("id_projet", img_projet);

                console.log(ok.info());
                ok.push();







    };
    // -------------------- CHECKBOX (FR: cocher multiple / EN: multiple check) --------------------
function handleCheckboxClick(clickedCheckbox) {

    const presentIds = [];
    const absentIds  = [];

    document.querySelectorAll('.check_btn').forEach(cb => {

        const id = cb.value;

        if (cb.checked) {
            presentIds.push(id);
        } else {
            absentIds.push(id);
        }
    });

    console.log('PRESENTS (checked) →', presentIds);
    console.log('ABSENTS  (unchecked) →', absentIds);

    var ok = new Information("<?= $appBase ?>req_on/id_projet_img_auto.php");
    ok.add("presentIds", presentIds);
    ok.add("absentIds", absentIds);

    console.log('PAYLOAD →', ok.info());
    ok.push();
}

</script>
