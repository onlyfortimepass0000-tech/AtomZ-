with open('src/index.html', 'r') as f:
    html = f.read()

html = html.replace('content="#fafbfc"', 'content="#fffcf9"')
html = html.replace('%232347ea', '%23ff7e27')

# Insert slices
slices = """
<div class="background-texture"></div>
<div class="slice slice-1"></div>
<div class="slice slice-2"></div>
<div class="slice slice-3"></div>
<div class="slice slice-4"></div>
"""

html = html.replace('<body>', '<body>\n' + slices)

with open('src/index.html', 'w') as f:
    f.write(html)
