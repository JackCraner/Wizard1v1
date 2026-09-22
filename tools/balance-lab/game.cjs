// This loader exists only in the development process. The app never imports it.
const fs = require('node:fs');
const ts = require('typescript');
const path = require('node:path');
const Module = require('node:module');
const resolve = Module._resolveFilename;
// Match Metro/TypeScript resolution when foo.ts and foo.json coexist.
Module._resolveFilename = function(request, parent, ...rest) {
  if (request.startsWith('.') && parent && !path.extname(request)) {
    const candidate = path.resolve(path.dirname(parent.filename), request + '.ts');
    if (fs.existsSync(candidate)) request = candidate;
  }
  return resolve.call(this, request, parent, ...rest);
};
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  module._compile(ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
    esModuleInterop: true, resolveJsonModule: true,
  }, fileName: filename }).outputText, filename);
};
module.exports = {
  ...require('../../src/game/engine.ts'),
  ...require('../../src/game/botAI.ts'),
  ...require('../../src/game/augments.ts'),
  ...require('../../src/game/tournament.ts'),
  tournament: require('../../src/config/tournament.json'),
};
