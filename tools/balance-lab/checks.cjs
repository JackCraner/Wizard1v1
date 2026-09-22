const { test } = require('node:test');
const assert = require('node:assert/strict');
const { run, build, randomSource, duel } = require('./simulation.cjs');
const { parse } = require('./run.cjs');
test('seeded experiments reproduce builds and outcomes', () => {
  const options = parse(['--builds','4','--tournaments','1','--rounds','2','--search','1']);
  assert.deepEqual(run(options), run(options));
});
test('self matchup draws, side reversal complements, inputs stay unchanged', () => {
  const random = randomSource(9), a = build(random,'a',3), b = build(random,'b',3);
  const before = structuredClone([a,b]);
  assert.equal(duel(a,a).score,.5);
  assert.equal(duel(a,b).score + duel(b,a).score,1);
  assert.deepEqual([a,b],before);
});
test('reject invalid experiment settings', () => {
  for (const args of [['--builds','0'],['--seed','NaN'],['--rounds','-1'],['--difficulty','unknown']]) assert.throws(()=>parse(args));
});
test('arena pairs each opponent in both orientations without self matches', () => {
  const data = run(parse(['--builds','4','--tournaments','0','--search','0']));
  const arena = data.matches.filter(m=>m.mode==='arena');
  assert.equal(arena.length,3*4*3);
  for (const m of arena) { assert.notEqual(m.a,m.b); assert.ok(arena.some(n=>n.a===m.b&&n.b===m.a)); }
});
test('report renders all filters and baseline comparisons without runtime errors', () => {
  const vm = require('node:vm');
  const { report } = require('./report.cjs');
  const { RULES } = require('./game.cjs');
  const options = parse(['--builds','4','--tournaments','1','--rounds','2','--search','0']);
  const data = { options, rules: RULES, fingerprint: 'test', elapsedSeconds: 1, ...run(options) };
  const html = report(data, data), nodes = {};
  const document = { getElementById: id => nodes[id] ??= { value: id === 'stage' ? 'all' : 'arena', append() {} }, createElement: () => ({}) };
  const context = vm.createContext({ document });
  vm.runInContext(html.match(/<script>([\s\S]*)<\/script>/)[1], context);
  for (const mode of ['arena','progression','search']) for (const stage of ['all','1','3','5','99']) {
    nodes.mode.value = mode; nodes.stage.value = stage; nodes.mode.onchange();
    assert.ok(nodes.spells.innerHTML.includes('<table>'));
  }
});
test('mobile bundler explicitly excludes the lab on Windows and Unix', () => {
  const { resolver } = require('../../metro.config.js');
  for (const file of ['D:\\Apps\\Wizard1v1\\tools\\balance-lab\\run.cjs', '/app/tools/balance-lab/reports/report.html'])
    assert.ok(resolver.blockList.some(pattern => pattern.test(file)));
});
