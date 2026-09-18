with open('src/style.css', 'r') as f:
    css = f.read()

import re

# Remove everything from "/* Orange Theme Customizations */" onwards
idx = css.find("/* Orange Theme Customizations */")
if idx != -1:
    css = css[:idx]

with open('src/style.css', 'w') as f:
    f.write(css)

