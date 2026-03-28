<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Canvas Couleur + Upload + Téléchargement</title>
<link rel="stylesheet" href="../../css.css">

</head>
<body>

<h2>Canvas Couleur et Upload</h2>

<input type="file" id="uploadBtn" accept="image/*">
<canvas id="canvas" width="500" height="300"></canvas>
<input type="text" id="colorCode" readonly placeholder="#RRGGBB">
<button id="downloadBtn">Télécharger l'image</button>

<script>
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const colorCode = document.getElementById('colorCode');
const uploadBtn = document.getElementById('uploadBtn');
const downloadBtn = document.getElementById('downloadBtn');
let currentImage = null;

// Dessiner l'image sur le canvas
function drawImageOnCanvas(img) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let ratio = Math.min(canvas.width / img.width, canvas.height / img.height);
    let newWidth = img.width * ratio;
    let newHeight = img.height * ratio;
    ctx.drawImage(img, (canvas.width - newWidth)/2, (canvas.height - newHeight)/2, newWidth, newHeight);
    currentImage = canvas.toDataURL("image/png"); // pour téléchargement
}

// Convertir RGB en HEX
function rgbToHex(r, g, b) {
    return "#" + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('');
}

// Obtenir le code couleur d'un pixel au clic
canvas.addEventListener('click', e => {
    if (!currentImage) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
    colorCode.value = hex;
});

// Upload image depuis le PC
uploadBtn.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => drawImageOnCanvas(img);
    img.src = URL.createObjectURL(file);
});

// Télécharger l'image du canvas
downloadBtn.addEventListener('click', () => {
    if (!currentImage) return alert("Aucune image à télécharger !");
    const link = document.createElement('a');
    link.href = currentImage;
    link.download = "canvas_image.png";
    link.click();
});
</script>

</body>
</html>
