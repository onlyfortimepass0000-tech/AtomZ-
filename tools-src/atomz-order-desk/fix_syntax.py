with open('src/style.css', 'r') as f:
    css = f.read()

import re
# Remove the broken chunks
css = re.sub(r'100% \{ transform: translate[^}]+ \}\s*\}', '', css)

with open('src/style.css', 'w') as f:
    f.write(css)
