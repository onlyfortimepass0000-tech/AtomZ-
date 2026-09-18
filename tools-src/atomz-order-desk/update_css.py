import re

with open('src/style.css', 'r') as f:
    css = f.read()

# Remove the slice-related CSS
css = re.sub(r'\.slice \{[^}]+\}', '', css)
css = re.sub(r'\.slice-\d+ \{[^}]+\}', '', css)
css = re.sub(r'@keyframes float\d+ \{[^}]+\}', '', css)

with open('src/style.css', 'w') as f:
    f.write(css)
