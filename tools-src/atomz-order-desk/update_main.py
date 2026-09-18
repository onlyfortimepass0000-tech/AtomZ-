import re

with open('src/style.css', 'r') as f:
    css = f.read()

# Make main look like a big panel
main_style = 'main{background:#fffcf9;border-radius:30px;box-shadow:0 10px 40px rgba(0,0,0,0.1);padding:30px;margin-bottom:40px;position:relative;z-index:1;'
css = css.replace('main{max-width:1180px;margin:auto;padding:24px 32px 80px}', main_style + 'max-width:1180px;margin:20px auto 80px;}')

# Same for mobile media query
css = css.replace('main{padding:14px 20px 164px}', 'main{padding:20px;border-radius:20px;margin:10px;margin-bottom:164px;}')
css = css.replace('main{padding-inline:14px}', 'main{padding:15px;margin:10px;margin-bottom:164px;}')

with open('src/style.css', 'w') as f:
    f.write(css)
