with open('src/style.css', 'r') as f:
    css = f.read()

# Updates based on visual audit of hex codes
replacements = {
    '#a9b6ff': '#ffb885',
    '#bac5e0': '#ffcba6',
    '#f8f9fd': '#fffaf5',
    '#1c264510': '#452b1c10',
    '#f0f2f5': '#fdf6ef',
    '#e9edf7': '#ffecd9',
    '#c6cee6': '#ffcdab',
    '#dce3ff': '#ffecd9',
    '#5270ff': '#ff6600',
    '#1c23452e': '#452b1c2e',
    '#1c234552': '#452b1c52',
}

for old, new in replacements.items():
    css = css.replace(old, new)

with open('src/style.css', 'w') as f:
    f.write(css)
