const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const domains = ['nature', 'water', 'fire', 'affliction', 'holy'];
const catalogue = domains.map(domain => ({domain, cards: read(`src/config/${domain}/spell.json`)}));
const augments = read('src/config/augments.json');
const rules = read('src/config/rules.json');
const cell = value => String(value).replaceAll('|', '\\|').replace(/\r?\n/g, '<br>');
const cast = ticks => ticks === 0 ? 'Instant' : ticks == null ? '—' : `${ticks}T`;
let md = `# Spell and augment reference\n\nGenerated from the shipping JSON catalogue. Edit the source configuration, then run \`npm run docs:generate\`; do not edit these tables by hand.\n\n**${catalogue.reduce((n, d) => n + d.cards.length, 0)} spells · ${augments.length} augments · ${rules.slots} combat slots.** Shopping can temporarily hold extra spells; reduce to the combat limit before battle. Bracketed clauses require the named Domain attunement. Upgrade columns show the complete upgraded effect. Gold price equals stars + 1. Calculated outcomes round down. See [combat rules](Combat.md) for timing and shared mechanics.\n\n`;
for (const {domain, cards} of catalogue) {
  md += `## ${domain[0].toUpperCase() + domain.slice(1)}\n\n| Stars | Spell | Cast | Base | Upgrade cast | Upgrade |\n| --- | --- | --- | --- | --- | --- |\n`;
  for (const c of cards) md += `| ${'★'.repeat(c.stars)} | ${cell(c.name)} | ${cast(c.castTicks)} | ${cell(c.rules)} | ${cast(c.upgrade.castTicks)} | ${cell(c.upgrade.rules)} |\n`;
  md += '\n';
}
md += `## Augments\n\nAll augments are available to every build. Every ${rules.augmentEvery} completed rounds grants a level and an augment choice. Duplicate augments cannot be owned.\n\n| Augment | Effect |\n| --- | --- |\n`;
for (const augment of augments) md += `| ${cell(augment.name)} | ${cell(augment.description)} |\n`;
const target = path.join(root, 'docs/Spell_and_Augment_Reference.md');
if (process.argv.includes('--check')) {
  if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== md) {
    console.error('Reference is out of date. Run npm run docs:generate.');
    process.exitCode = 1;
  }
} else fs.writeFileSync(target, md);
