import fs from 'node:fs/promises';
import path from 'node:path';

const srcDir = new URL('./src/', import.meta.url);
const read = name => fs.readFile(new URL(name, srcDir), 'utf8');

const [html, css, core, app] = await Promise.all(['index.html', 'style.css', 'core.js', 'app.js'].map(read));

const output = html
  .replace('<!-- STYLE -->', () => `<style>${css}</style>`)
  .replace('<!-- CORE -->', () => `<script id="desk-core">${core}</script>`)
  .replace('<!-- APP -->', () => `<script>${app}</script>`);

const outDir = new URL('../../tools/order-desk/', import.meta.url);
await fs.mkdir(outDir, { recursive: true });
await fs.writeFile(new URL('index.html', outDir), output);

console.log(`Built standalone Order Desk to tools/order-desk/index.html: ${Buffer.byteLength(output).toLocaleString()} bytes.`);
