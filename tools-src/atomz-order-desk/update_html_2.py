import re

with open('src/index.html', 'r') as f:
    html = f.read()

# Remove the slices
html = re.sub(r'<div class="slice slice-\d+"></div>\n?', '', html)

# We will add some abstract blobs instead for the background motion
blobs = """<div class="blob blob-1"></div>
<div class="blob blob-2"></div>
<div class="blob blob-3"></div>"""

if '<div class="blob' not in html:
    html = html.replace('<body>', '<body>\n' + blobs)

# For the ripple effect, we might need a little JS to add a span, or we can use CSS :active scaling.
# The user wants "subtle water effects" on click animations. A true CSS ripple on click needs either JS, 
# or we can do a CSS trick with `:active::after` that expands a radial gradient.
# Let's write the HTML first.

with open('src/index.html', 'w') as f:
    f.write(html)
