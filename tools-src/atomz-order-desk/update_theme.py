import re

with open('src/style.css', 'r') as f:
    css = f.read()

# Update root background from bright to an orange peel color
# We used #fffcf9 previously. Let's find it and replace it with a strong orange.
css = css.replace('background:#fffcf9 url(', 'background:#ff8c00 url(')

# Wait, previously we added the background url to :root
# Let's just explicitly replace the :root block's background.
css = re.sub(r'background:\s*#[a-fA-F0-9]+\s*url\([^)]+\);', '', css)

# Make sure --orange is defined
if '--orange' not in css:
    css = css.replace('--blue', '--orange')

# We need to make sure the app text color is readable. 
# If the body is orange, we should probably wrap the main content in a white container, 
# or just make the text white on the body, but panels are white so text in panels is dark.
# Let's leave text dark for panels, and let's add a white background to `main`?
# Actually, the original design has `.panel` with white background.
# If body is orange, panels (white) will look like the flesh. 
# Let's adjust .topbar and .nav to look good on orange.
css = css.replace('.topbar{', '.topbar{background:rgba(255, 255, 255, 0.95);border-radius:0 0 20px 20px;margin-bottom:20px;box-shadow:0 4px 15px rgba(0,0,0,0.05);')
css = css.replace('.nav{', '.nav{background:rgba(255, 255, 255, 0.95);border-radius:20px;box-shadow:0 4px 15px rgba(0,0,0,0.05);border:none;')

# Update root background
css = css.replace(':root{', ':root{background:#ff9514 url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'150\' height=\'150\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'150\' height=\'150\' filter=\'url(%23n)\' opacity=\'0.12\'/%3E%3C/svg%3E");')

# Buttons need the orange fibre texture
css = css.replace('.button.primary{background:var(--orange)', '.button.primary{background:var(--orange) url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23n)\' opacity=\'0.15\'/%3E%3C/svg%3E")')
css = css.replace('.button{', '.button{position:relative;overflow:hidden;')

with open('src/style.css', 'w') as f:
    f.write(css)
