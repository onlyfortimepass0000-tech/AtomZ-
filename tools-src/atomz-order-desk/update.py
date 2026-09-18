import re

with open('src/style.css', 'r') as f:
    css = f.read()

# Replace variables
css = css.replace('--blue:#2347ea', '--orange:#ff7e27')
css = css.replace('var(--blue)', 'var(--orange)')
css = css.replace('background:#fafbfc', 'background:#fffcf9')
css = css.replace('--soft:#f4f6fa', '--soft:#fff4eb')
css = css.replace('--line:#e8ebf0', '--line:#ffe6d3')

# Additional hover colors
css = css.replace('background:#1738c7', 'background:#ea6b14') # primary hover
css = css.replace('background:#edf0ff', 'background:#ffecd9') # sample pill bg
css = css.replace('color:#4e62a8', 'color:#b35000') # initial text
css = css.replace('background:#f0f3ff', 'background:#ffecd9') # initial bg
css = css.replace('background:#e9edff', 'background:#ffecd9') # count bg
css = css.replace('background:#eff2ff', 'background:#ffecd9') # booked status bg
css = css.replace('color:#3150bc', 'color:#cc5a00') # booked status text
css = css.replace('box-shadow:0 6px 18px #2347ea26', 'box-shadow:0 6px 18px #ff7e2740')

with open('src/style.css', 'w') as f:
    f.write(css)
