// Toggle formulaire admin sur la page de connexion
// Depend de : auth/login.php (elements HTML : .admin-toggle, #adminForm)
// Utilise par : auth/login.php
//
// +---------------------+----------------------------------------------+
// | Element HTML        | Action                                       |
// +---------------------+----------------------------------------------+
// | .admin-toggle       | Clic → toggle classe .show sur #adminForm    |
// | #adminForm          | Visible (.show) / cache (defaut)             |
// +---------------------+----------------------------------------------+
document.addEventListener('DOMContentLoaded', function() {
    var toggle = document.querySelector('.admin-toggle');
    var form = document.getElementById('adminForm');
    if (toggle && form) {
        toggle.addEventListener('click', function() {
            form.classList.toggle('show');
        });
    }
});
