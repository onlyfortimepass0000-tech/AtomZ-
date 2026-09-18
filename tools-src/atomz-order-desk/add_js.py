with open('src/index.html', 'r') as f:
    html = f.read()

ripple_js = """
<script>
document.addEventListener('mousedown', function(e) {
    var target = e.target.closest('button, .button');
    if (!target) return;
    var rect = target.getBoundingClientRect();
    var ripple = document.createElement('span');
    ripple.className = 'water-ripple';
    ripple.style.left = (e.clientX - rect.left) + 'px';
    ripple.style.top = (e.clientY - rect.top) + 'px';
    target.appendChild(ripple);
    setTimeout(function() { ripple.remove(); }, 600);
});
</script>
"""

html = html.replace('</body>', ripple_js + '</body>')

with open('src/index.html', 'w') as f:
    f.write(html)
