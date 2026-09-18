import re

with open('src/style.css', 'r') as f:
    css = f.read()

# First, remove ALL background declarations in :root
# A simpler way: we know it starts with `:root{...}`
root_match = re.search(r':root\{([^}]+)\}', css)
if root_match:
    inner = root_match.group(1)
    # remove all background properties
    inner = re.sub(r'background:[^;]+;', '', inner)
    # add the desired background at the start
    new_root = ':root{background:#ff9514 url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'150\' height=\'150\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'150\' height=\'150\' filter=\'url(%23n)\' opacity=\'0.12\'/%3E%3C/svg%3E");' + inner + '}'
    css = css[:root_match.start()] + new_root + css[root_match.end():]

with open('src/style.css', 'w') as f:
    f.write(css)
