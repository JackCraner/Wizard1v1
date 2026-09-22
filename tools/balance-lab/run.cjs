const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { run, duel } = require('./simulation.cjs');
const { report } = require('./report.cjs');
const { RULES, BOT_CONFIG } = require('./game.cjs');
const root = path.resolve(__dirname, '../..');
const defaults = { seed: 42, builds: 24, tournaments: 10, rounds: 24, search: 30, difficulty: 'normal' };
function parse(args) {
  const options = { ...defaults };
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, ''), value = args[i + 1];
    if (!args[i].startsWith('--') || value === undefined || ![...Object.keys(defaults), 'out', 'baseline', 'replay'].includes(key)) throw new Error(`Invalid option: ${args[i]}`);
    options[key] = typeof defaults[key] === 'number' ? Number(value) : value;
  }
  for (const key of ['seed', 'builds', 'tournaments', 'rounds', 'search'])
    if (!Number.isSafeInteger(options[key]) || options[key] < (key === 'builds' ? 4 : key === 'rounds' ? 1 : 0)) throw new Error(`Invalid ${key}`);
  if (options.seed > 4294967295) throw new Error('Seed must fit in an unsigned 32-bit integer');
  if (!BOT_CONFIG.difficulties[options.difficulty]) throw new Error('Unknown difficulty');
  return options;
}
function fingerprint() {
  const hash = crypto.createHash('sha256');
  function visit(dir) { for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a,b)=>a.name.localeCompare(b.name))) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'reports') visit(file);
    else if (/\.(ts|json|cjs)$/.test(file) && !file.endsWith('.test.ts')) { hash.update(path.relative(root, file).replaceAll('\\', '/')); hash.update(fs.readFileSync(file)); }
  } }
  visit(path.join(root, 'src/game')); visit(path.join(root, 'src/config')); visit(__dirname);
  return hash.digest('hex');
}
function main(args) {
  if (args.includes('--help')) { console.log('Balance lab: --builds 24 --tournaments 10 --rounds 24 --search 30 --seed 42 --difficulty normal --out DIRECTORY --baseline RESULTS_JSON\nReplay: --replay SCENARIO_JSON --out DIRECTORY'); return; }
  const options = parse(args);
  const out = path.resolve(options.out || path.join(__dirname, 'reports', new Date().toISOString().replace(/[:.]/g, '-')));
  if (fs.existsSync(out) && fs.readdirSync(out).length) throw new Error('Output directory must be empty; choose a new directory to preserve previous runs');
  if (options.replay) {
    const scenario = JSON.parse(fs.readFileSync(options.replay, 'utf8'));
    const result = duel(scenario.a, scenario.b, true);
    fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, 'replay.json'), JSON.stringify(result, null, 2)); console.log(`Replay: ${out}`); return;
  }
  const baseline = options.baseline ? JSON.parse(fs.readFileSync(options.baseline, 'utf8')) : null;
  if (baseline && (baseline.schema !== 1 || Object.keys(defaults).some(k => baseline.options[k] !== options[k]))) throw new Error('Baseline requires the same seed and experiment options for a meaningful comparison');
  const start = performance.now();
  const data = { schema: 1, options, rules: RULES, fingerprint: fingerprint(), ...run(options, console.log), elapsedSeconds: +((performance.now() - start) / 1000).toFixed(2) };
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(data));
  fs.writeFileSync(path.join(out, 'report.html'), report(data, baseline));
  fs.writeFileSync(path.join(out, 'matches.csv'), ['mode,stage,round,a,b,score,ticks,healthA,healthB,endReason', ...data.matches.map(m => [m.mode,m.stage,m.round,m.a,m.b,m.score,m.ticks,m.healthA,m.healthB,m.endReason].join(','))].join('\n'));
  const byId = Object.fromEntries(data.builds.map(b => [b.id, b]));
  data.matches.filter(m => m.mode === 'search').sort((a,b)=>a.ticks-b.ticks).slice(0,5).forEach((m,i) => {
    const scenario = { fingerprint: data.fingerprint, a: byId[m.a], b: byId[m.b] };
    fs.writeFileSync(path.join(out, `scenario-${i+1}.json`), JSON.stringify(scenario, null, 2));
    fs.writeFileSync(path.join(out, `trace-${i+1}.json`), JSON.stringify(duel(scenario.a, scenario.b, true), null, 2));
  });
  console.log(`Report: ${path.join(out, 'report.html')}\n${data.matches.length} recorded battles in ${data.elapsedSeconds}s (search and removal probes are additional).`);
}
if (require.main === module) { try { main(process.argv.slice(2)); } catch (error) { console.error(error.message); process.exitCode = 1; } }
module.exports = { parse, fingerprint };
