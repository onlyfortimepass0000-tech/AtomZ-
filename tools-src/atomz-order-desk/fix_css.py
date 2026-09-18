import re

with open('src/style.css', 'r') as f:
    css = f.read()

# Remove .background-texture block
css = re.sub(r'\.background-texture\s*\{[^}]*\}\s*', '', css)

with open('src/style.css', 'w') as f:
    f.write(css)
