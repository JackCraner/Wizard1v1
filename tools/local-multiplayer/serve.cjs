// Desktop counterpart of the Android host, for LAN/browser development.
const { buildSync } = require('esbuild');
const path = require('node:path');
const output = path.resolve(__dirname, '../../.local-multiplayer/server.cjs');
buildSync({ entryPoints: [path.join(__dirname, 'server.ts')], outfile: output, bundle: true, platform: 'node', format: 'cjs', target: 'node20' });
require(output);
