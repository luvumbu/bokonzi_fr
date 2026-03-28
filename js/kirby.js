// Toggle jour/nuit — partage par toutes les pages
// Depend de : css/kirby.css (.day-mode)
// Utilise par : index.php, auth/login.php, pages/dashboard.php

function toggleDayNight(btn) {
    var world = btn.closest('.kirby-world');
    var isDay = world.classList.toggle('day-mode');
    var icon = btn.querySelector('span:first-child');
    var label = btn.querySelector('.mode-label');

    if (isDay) {
        icon.innerHTML = '&#9790;';
        label.textContent = 'Nuit';
    } else {
        icon.innerHTML = '&#9788;';
        label.textContent = 'Jour';
    }

    // Sauvegarder la preference
    localStorage.setItem('kirby-mode', isDay ? 'day' : 'night');
}

// Restaurer la preference au chargement
document.addEventListener('DOMContentLoaded', function() {
    var mode = localStorage.getItem('kirby-mode');
    if (mode === 'day') {
        var worlds = document.querySelectorAll('.kirby-world');
        worlds.forEach(function(w) { w.classList.add('day-mode'); });
        var btns = document.querySelectorAll('.kirby-toggle-mode');
        btns.forEach(function(btn) {
            var icon = btn.querySelector('span:first-child');
            var label = btn.querySelector('.mode-label');
            if (icon) icon.innerHTML = '&#9790;';
            if (label) label.textContent = 'Nuit';
        });
    }
});
