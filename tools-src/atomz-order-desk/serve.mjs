import http from 'node:http';
import fs from 'node:fs/promises';
const port = Number(process.env.ORDER_DESK_PORT || 4188);
const server = http.createServer(async (req, res) => {
  const route = new URL(req.url, 'http://localhost').pathname;
  if (!['/', '/index.html', '/GooglePay_QR.png'].includes(route)) { res.writeHead(404); res.end('Not found'); return; }
  try {
    const file = route === '/GooglePay_QR.png' ? './dist/GooglePay_QR.png' : './dist/index.html';
    const body = await fs.readFile(new URL(file, import.meta.url));
    res.writeHead(200, {'Content-Type':route === '/GooglePay_QR.png' ? 'image/png' : 'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(500); res.end('Could not load Order Desk.'); }
});
server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? `Port ${port} is in use. Try ORDER_DESK_PORT=4189 node serve.mjs` : error.message); process.exitCode=1; });
server.listen(port, '127.0.0.1', () => console.log(`Order Desk is ready at http://127.0.0.1:${port}`));
