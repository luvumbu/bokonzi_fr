<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Recherche d'Articles Asynchrone</title>
<link rel="stylesheet" href="../../css.css">

</head>
<body>

<h1>Recherche d'Articles</h1>

<div class="search-bar">
  <input type="text" id="searchInput" placeholder="Rechercher un article...">
</div>

<div class="articles">
  <div class="article">Comment apprendre le JavaScript facilement</div>
  <div class="article">10 astuces pour coder plus vite</div>
  <div class="article">Les meilleurs frameworks front-end en 2026</div>
  <div class="article">Créer un site web responsive</div>
  <div class="article">Optimiser le SEO de votre blog</div>
</div>

<script>
const input = document.getElementById('searchInput');
const articles = document.querySelectorAll('.article');

input.addEventListener('input', () => {
  const filter = input.value.toLowerCase();

  articles.forEach(article => {
    const text = article.textContent.toLowerCase();
    article.classList.toggle('hidden', !text.includes(filter));
  });
});
</script>

</body>
</html>
