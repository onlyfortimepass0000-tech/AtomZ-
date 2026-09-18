import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const read = name => fs.readFile(path.join(__dirname, 'src', name), 'utf8');
const [html, css, core, app] = await Promise.all(['index.html', 'style.css', 'core.js', 'app.js'].map(read));

const output = html
  .replace(/<!-- STYLE --><link data-source-style[^>]*>/, () => `<style>${css}</style>`)
  .replace(/<!-- CORE --><script data-source-core[^>]*><\/script>/, () => `<script id="desk-core">${core}</script>`)
  .replace(/<!-- APP --><script data-source-app[^>]*><\/script>/, () => `<script>${app}</script>`);

// Write to local dist
await fs.mkdir(path.join(__dirname, 'dist'), { recursive: true });
await fs.writeFile(path.join(__dirname, 'dist', 'index.html'), output);

// Write to website tools directory
const targetDir = path.join(__dirname, '..', '..', 'tools', 'order-desk');
await fs.mkdir(targetDir, { recursive: true });
await fs.writeFile(path.join(targetDir, 'index.html'), output);

console.log(`Built standalone Order Desk: ${Buffer.byteLength(output).toLocaleString()} bytes.`);
