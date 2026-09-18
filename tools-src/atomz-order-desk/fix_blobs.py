with open('src/style.css', 'r') as f:
    css = f.read()

css = css.replace('filter: blur(60px);', '')
css = css.replace('background: #ffb732;', 'background: radial-gradient(circle, #ffb732 0%, transparent 70%);')
css = css.replace('background: #ff5e00;', 'background: radial-gradient(circle, #ff5e00 0%, transparent 70%);')
css = css.replace('background: #ffd54f;', 'background: radial-gradient(circle, #ffd54f 0%, transparent 70%);')

with open('src/style.css', 'w') as f:
    f.write(css)
