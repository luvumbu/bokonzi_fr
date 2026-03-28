<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Tests DatabaseHandler</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0d1117; color: #c9d1d9; font-family: 'Segoe UI', monospace; padding: 30px; }
        h1 { color: #6c5ce7; margin-bottom: 5px; font-size: 28px; }
        .subtitle { color: #8b949e; margin-bottom: 25px; font-size: 14px; }
        .summary { padding: 18px 24px; border-radius: 10px; font-size: 18px; margin-bottom: 25px; display: flex; align-items: center; gap: 20px; }
        .summary.ok { background: #2ecc7115; border: 1px solid #2ecc71; }
        .summary.fail { background: #e74c3c15; border: 1px solid #e74c3c; }
        .summary.loading { background: #6c5ce715; border: 1px solid #6c5ce7; }
        .summary .num { font-size: 36px; font-weight: bold; }
        .summary.ok .num { color: #2ecc71; }
        .summary.fail .num { color: #e74c3c; }
        .summary.loading .num { color: #6c5ce7; }
        .stats { display: flex; gap: 8px; }
        .stats span { padding: 4px 12px; border-radius: 6px; font-size: 13px; }
        .stats .pass { background: #2ecc7120; color: #2ecc71; }
        .stats .fail { background: #e74c3c20; color: #e74c3c; }
        .stats .time { background: #f39c1220; color: #f39c12; }
        .section { margin-bottom: 15px; border: 1px solid #30363d; border-radius: 8px; overflow: hidden; }
        .section-header { background: #161b22; padding: 12px 16px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
        .section-header:hover { background: #1c2128; }
        .section-title { font-weight: 600; font-size: 15px; }
        .section-badge { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
        .section-badge.ok { background: #2ecc7120; color: #2ecc71; }
        .section-badge.fail { background: #e74c3c20; color: #e74c3c; }
        .section-tests { display: none; border-top: 1px solid #30363d; }
        .section.open .section-tests { display: block; }
        .test-row { padding: 8px 16px 8px 24px; border-bottom: 1px solid #21262d; display: flex; align-items: center; gap: 10px; font-size: 13px; }
        .test-row:last-child { border-bottom: none; }
        .test-row .icon { font-size: 14px; flex-shrink: 0; }
        .test-row.ok .icon { color: #2ecc71; }
        .test-row.fail .icon { color: #e74c3c; }
        .test-row.fail { background: #e74c3c08; }
        .btn-run { background: #6c5ce7; color: white; border: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; cursor: pointer; margin-bottom: 20px; }
        .btn-run:hover { background: #5a4bd1; }
        .btn-run:disabled { opacity: 0.5; cursor: not-allowed; }
        .spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid #6c5ce740; border-top-color: #6c5ce7; border-radius: 50%; animation: spin 0.6s linear infinite; margin-right: 8px; }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body>

<h1>Tests DatabaseHandler</h1>
<p class="subtitle">79 tests &mdash; 36 methodes &mdash; 11 sections</p>

<button class="btn-run" id="btnRun" onclick="runTests()">Lancer les tests</button>

<div id="summary" class="summary loading" style="display:none">
    <div class="num" id="sumNum">...</div>
    <div>
        <div id="sumLabel" style="font-weight:600; margin-bottom:6px;">Chargement...</div>
        <div class="stats">
            <span class="pass" id="sumPass">-</span>
            <span class="fail" id="sumFail" style="display:none">-</span>
            <span class="time" id="sumTime">-</span>
        </div>
    </div>
</div>

<div id="sections"></div>

<script>
function runTests() {
    var btn = document.getElementById('btnRun');
    var sum = document.getElementById('summary');
    var sec = document.getElementById('sections');

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>Tests en cours...';
    sum.style.display = 'flex';
    sum.className = 'summary loading';
    document.getElementById('sumNum').textContent = '...';
    document.getElementById('sumLabel').textContent = 'Execution en cours...';
    document.getElementById('sumPass').textContent = '-';
    document.getElementById('sumFail').style.display = 'none';
    document.getElementById('sumTime').textContent = '-';
    sec.innerHTML = '';

    var t0 = performance.now();

    fetch('DatabaseHandler_tests.php')
        .then(function(r) { return r.json(); })
        .then(function(data) {
            var ms = Math.round(performance.now() - t0);
            renderResults(data, ms);
            btn.disabled = false;
            btn.textContent = 'Relancer les tests';
        })
        .catch(function(err) {
            sum.className = 'summary fail';
            document.getElementById('sumNum').textContent = '!';
            document.getElementById('sumLabel').textContent = 'Erreur : ' + err.message;
            btn.disabled = false;
            btn.textContent = 'Reessayer';
        });
}

function renderResults(data, ms) {
    var sum = document.getElementById('summary');
    sum.className = data.success ? 'summary ok' : 'summary fail';
    document.getElementById('sumNum').textContent = data.passed + '/' + data.total;
    document.getElementById('sumLabel').textContent = data.success ? 'Tous les tests sont passes' : data.failed + ' test(s) en echec';
    document.getElementById('sumPass').textContent = data.passed + ' passes';

    var failEl = document.getElementById('sumFail');
    if (data.failed > 0) {
        failEl.textContent = data.failed + ' echec(s)';
        failEl.style.display = '';
    } else {
        failEl.style.display = 'none';
    }

    document.getElementById('sumTime').textContent = ms + ' ms';

    var html = '';
    var sectionNames = Object.keys(data.sections);
    for (var i = 0; i < sectionNames.length; i++) {
        var name = sectionNames[i];
        var s = data.sections[name];
        var isOk = s.failed === 0;
        var openClass = !isOk ? ' open' : '';

        html += '<div class="section' + openClass + '" onclick="toggleSection(this)">';
        html += '<div class="section-header">';
        html += '<span class="section-title">' + (i + 1) + '. ' + name + '</span>';
        html += '<span class="section-badge ' + (isOk ? 'ok' : 'fail') + '">' + s.passed + '/' + (s.passed + s.failed) + '</span>';
        html += '</div>';
        html += '<div class="section-tests">';

        for (var j = 0; j < s.tests.length; j++) {
            var t = s.tests[j];
            html += '<div class="test-row ' + (t.ok ? 'ok' : 'fail') + '">';
            html += '<span class="icon">' + (t.ok ? '&#10003;' : '&#10007;') + '</span>';
            html += '<span>' + t.test + '</span>';
            html += '</div>';
        }

        html += '</div></div>';
    }

    document.getElementById('sections').innerHTML = html;
}

function toggleSection(el) {
    el.classList.toggle('open');
}
</script>

</body>
</html>
