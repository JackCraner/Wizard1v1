import { createServer } from 'node:http';
import { randomBytes, randomUUID } from 'node:crypto';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { extname, resolve, sep } from 'node:path';
import { RoomAuthority } from '../../src/multiplayer/roomAuthority';

const port = Number(process.env.LOCAL_MULTIPLAYER_PORT || 8787);
const root = resolve('android/app/src/main/assets/local-web');
if (!existsSync(resolve(root, 'index.html'))) throw new Error('Run npm run local:web before starting the local server.');
const options = { hostToken: randomUUID(), guestToken: randomUUID(), invite: randomUUID(), seed: randomBytes(4).readUInt32LE() };
const authority = new RoomAuthority(options);
const addresses = Object.values(networkInterfaces()).flat().filter(x => x && x.family === 'IPv4' && !x.internal).map(x => `http://${x!.address}:${port}`);
const mime: Record<string, string> = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };
const server = createServer(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  const json = (value: unknown, status = 200) => { response.writeHead(status, { 'Content-Type': 'application/json' }); response.end(JSON.stringify(value)); };
  try {
    const url = new URL(request.url!, `http://${request.headers.host}`);
    if (request.method === 'POST' && ['/api/room', '/api/bootstrap'].includes(url.pathname)) {
      if (request.headers.origin && request.headers.origin !== `http://${request.headers.host}`) return json({ ok: false, error: 'Origin not allowed.' }, 403);
      if (!request.headers['content-type']?.startsWith('application/json')) return json({ ok: false, error: 'JSON required.' }, 415);
      const chunks: Buffer[] = []; let bytes = 0;
      for await (const chunk of request) { bytes += chunk.length; if (bytes > 16384) { json({ ok: false, error: 'Request too large.' }, 413); return; } chunks.push(chunk); }
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (url.pathname === '/api/bootstrap') {
        if (body.token !== options.hostToken) return json({ error: 'Invalid host key.' }, 403);
        return json({ origin: addresses[0] ?? `http://127.0.0.1:${port}`, addresses, invite: options.invite, hostToken: options.hostToken, seed: options.seed });
      }
      return json({ ok: true, snapshot: await authority.handle(body) });
    }
    if (request.method !== 'GET') { response.writeHead(405); response.end(); return; }
    const path = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!path.startsWith(root + sep) || !existsSync(path) || !statSync(path).isFile()) { response.writeHead(404); response.end('Not found'); return; }
    response.setHeader('Content-Type', mime[extname(path)] ?? 'application/octet-stream');
    createReadStream(path).on('error', () => response.destroy()).pipe(response);
  } catch (error) { if (!response.headersSent) json({ ok: false, error: error instanceof Error ? error.message : 'Invalid request.' }, 400); }
});
server.requestTimeout = 12000;
server.headersTimeout = 10000;
server.maxConnections = 32;
server.listen(port, '0.0.0.0', () => {
  console.log(`Host: http://127.0.0.1:${port}/#host=${options.hostToken}`);
  console.log(`Guest: ${addresses[0] ?? `http://127.0.0.1:${port}`}/#join=${options.invite}`);
});
